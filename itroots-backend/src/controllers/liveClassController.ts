import { Response } from 'express';
import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import LiveClass from '../models/LiveClass';
import Batch from '../models/Batch';
import Course from '../models/Course';
import User from '../models/User';
import Enrollment from '../models/Enrollment';
import Notification from '../models/Notification';
import NotificationRecipient from '../models/NotificationRecipient';
import { isLiveClassTableReady } from '../utils/liveClassSchema';

const DEFAULT_JITSI_DOMAIN = String(process.env.JITSI_DOMAIN || 'meet.jit.si').trim();

const asTrimmedString = (value: any) => String(value ?? '').trim();

const resolveLiveClassProvider = (value: any, fallback: 'JITSI' | 'EXTERNAL' = 'JITSI') => {
    const normalized = asTrimmedString(value).toUpperCase();
    if (normalized === 'EXTERNAL') return 'EXTERNAL';
    if (normalized === 'JITSI') return 'JITSI';
    return fallback;
};

const sanitizeRoomName = (value: any) => asTrimmedString(value)
    .replace(/^https?:\/\/[^/]+\//i, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const normalizeJitsiDomain = (value?: any) => asTrimmedString(value || DEFAULT_JITSI_DOMAIN)
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/g, '') || DEFAULT_JITSI_DOMAIN;

const buildGeneratedRoomName = (batchId: string) => {
    const batchToken = sanitizeRoomName(batchId).slice(0, 8) || 'batch';
    return `itroots-${batchToken}-${Date.now()}`;
};

const buildJitsiMeetingLink = (domain: string, roomName: string) => `https://${domain}/${roomName}`;
const buildLiveClassJoinPath = (liveClassId: string) => `/lms/student/live-classes/${liveClassId}`;

const parseScheduledAt = (value: any) => {
    const normalized = asTrimmedString(value);
    if (!normalized) return null;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return null;
    return date;
};

const liveClassInclude = [
    { model: Course, as: 'course', attributes: ['id', 'title', 'slug'] },
    { model: Batch, as: 'batch', attributes: ['id', 'name'] },
    { model: User, as: 'Faculty', attributes: ['id', 'name', 'email'] },
];

const ensureFacultyBatchAccess = async (FacultyId: string, batchId: string, courseId: string) => {
    const batch = await Batch.findOne({
        where: { id: batchId, FacultyId },
        include: [{ model: Course, as: 'course', attributes: ['id', 'title', 'slug'] }],
    });

    if (!batch) {
        throw new Error('Assigned batch not found for this Faculty');
    }

    if ((batch as any).courseId !== courseId) {
        throw new Error('Selected batch does not belong to the selected course');
    }

    return batch;
};

const createStudentNotification = async ({
    FacultyId,
    liveClass,
    action,
}: {
    FacultyId: string;
    liveClass: any;
    action: 'created' | 'updated' | 'cancelled' | 'completed';
}) => {
    const enrollments = await Enrollment.findAll({
        where: { batchId: liveClass.batchId },
        include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email'] }],
    });

    const recipients = enrollments
        .map((enrollment: any) => enrollment.student)
        .filter((student: any) => student?.id);

    if (!recipients.length) return;

    const scheduledAt = new Date(liveClass.scheduledAt).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });

    const titlePrefix = action === 'created'
        ? 'New Live Class'
        : action === 'updated'
            ? 'Live Class Updated'
            : action === 'completed'
                ? 'Live Class Ended'
                : 'Live Class Cancelled';
    const title = `${titlePrefix}: ${liveClass.title}`;
    const joinLine = action === 'cancelled'
        ? 'Status: Cancelled'
        : action === 'completed'
            ? 'Status: Completed'
        : liveClass.provider === 'JITSI' && liveClass.joinPath
            ? `Join in LMS: ${liveClass.joinPath}`
            : `Meeting Link: ${liveClass.meetingLink}`;
    const message = [
        `${liveClass.title}`,
        `Course: ${liveClass.course?.title || 'Course'}`,
        `Batch: ${liveClass.batch?.name || 'Batch'}`,
        `Scheduled At: ${scheduledAt}`,
        joinLine,
        liveClass.description ? `Agenda: ${liveClass.description}` : null,
    ].filter(Boolean).join('\n');

    const notification = await Notification.create({
        title,
        message,
        type: 'NOTIFICATION',
        audienceType: 'SELECTED_STUDENTS',
        sendEmail: false,
        createdBy: FacultyId,
        batchId: liveClass.batchId,
        courseId: liveClass.courseId,
    });

    await NotificationRecipient.bulkCreate(recipients.map((recipient: any) => ({
        notificationId: notification.id,
        userId: recipient.id,
        emailSent: false,
    })));
};

export const getFacultyLiveClasses = async (req: any, res: Response) => {
    try {
        if (!(await isLiveClassTableReady())) {
            return res.json([]);
        }

        const FacultyId = req.user.id;
        const liveClasses = await LiveClass.findAll({
            where: { FacultyId },
            include: liveClassInclude,
            order: [['scheduledAt', 'ASC']],
        });
        res.json(liveClasses);
    } catch (error) {
        console.error('Fetch Faculty live classes error:', error);
        res.status(500).json({ message: 'Error fetching live classes' });
    }
};

export const createLiveClass = async (req: any, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
        if (!(await isLiveClassTableReady())) {
            await transaction.rollback();
            return res.status(503).json({ message: 'Live classes database table is not ready yet' });
        }

        const FacultyId = req.user.id;
        const { title, courseId, batchId, scheduledAt, meetingLink, description, provider, roomName, jitsiDomain } = req.body;
        const normalizedTitle = asTrimmedString(title);
        const normalizedDescription = asTrimmedString(description) || null;
        const normalizedScheduledAt = parseScheduledAt(scheduledAt);
        const normalizedProvider = resolveLiveClassProvider(provider, 'JITSI');
        if (!normalizedTitle || !courseId || !batchId || !normalizedScheduledAt) {
            await transaction.rollback();
            return res.status(400).json({ message: 'title, courseId, batchId and a valid scheduledAt are required' });
        }

        await ensureFacultyBatchAccess(FacultyId, batchId, courseId);

        const liveClassId = randomUUID();
        const joinPath = normalizedProvider === 'JITSI' ? buildLiveClassJoinPath(liveClassId) : null;
        const resolvedRoomName = normalizedProvider === 'JITSI'
            ? (sanitizeRoomName(roomName) || buildGeneratedRoomName(batchId))
            : null;
        const resolvedJitsiDomain = normalizedProvider === 'JITSI'
            ? normalizeJitsiDomain(jitsiDomain)
            : null;
        const resolvedMeetingLink = normalizedProvider === 'JITSI'
            ? buildJitsiMeetingLink(resolvedJitsiDomain!, resolvedRoomName!)
            : asTrimmedString(meetingLink);

        if (normalizedProvider === 'EXTERNAL' && !resolvedMeetingLink) {
            await transaction.rollback();
            return res.status(400).json({ message: 'meetingLink is required for external live classes' });
        }

        const liveClass = await LiveClass.create({
            id: liveClassId,
            title: normalizedTitle,
            courseId,
            batchId,
            FacultyId,
            scheduledAt: normalizedScheduledAt,
            meetingLink: resolvedMeetingLink,
            provider: normalizedProvider,
            roomName: resolvedRoomName,
            jitsiDomain: resolvedJitsiDomain,
            joinPath,
            description: normalizedDescription || undefined,
            status: 'SCHEDULED',
        }, { transaction });

        await transaction.commit();

        const created = await LiveClass.findByPk(liveClass.id, { include: liveClassInclude });
        await createStudentNotification({ FacultyId, liveClass: created, action: 'created' });

        res.status(201).json({ message: 'Live class created successfully', liveClass: created });
    } catch (error: any) {
        await transaction.rollback();
        res.status(500).json({ message: error.message || 'Error creating live class' });
    }
};

export const updateLiveClass = async (req: any, res: Response) => {
    try {
        if (!(await isLiveClassTableReady())) {
            return res.status(503).json({ message: 'Live classes database table is not ready yet' });
        }

        const FacultyId = req.user.id;
        const liveClassId = req.params.liveClassId as string;
        const liveClass = await LiveClass.findOne({ where: { id: liveClassId, FacultyId } });
        if (!liveClass) return res.status(404).json({ message: 'Live class not found' });

        const nextCourseId = req.body.courseId || liveClass.courseId;
        const nextBatchId = req.body.batchId || liveClass.batchId;
        await ensureFacultyBatchAccess(FacultyId, nextBatchId, nextCourseId);

        const normalizedProvider = req.body.provider !== undefined
            ? resolveLiveClassProvider(req.body.provider, liveClass.provider || 'JITSI')
            : (liveClass.provider || 'JITSI');
        const normalizedScheduledAt = req.body.scheduledAt !== undefined
            ? parseScheduledAt(req.body.scheduledAt)
            : undefined;
        const normalizedUpdatedTitle = req.body.title !== undefined ? asTrimmedString(req.body.title) : undefined;

        if (req.body.title !== undefined && !normalizedUpdatedTitle) {
            return res.status(400).json({ message: 'title cannot be empty' });
        }

        if (req.body.scheduledAt !== undefined && !normalizedScheduledAt) {
            return res.status(400).json({ message: 'scheduledAt must be a valid date-time' });
        }

        const updates: any = {
            title: normalizedUpdatedTitle,
            courseId: req.body.courseId,
            batchId: req.body.batchId,
            scheduledAt: normalizedScheduledAt,
            description: req.body.description !== undefined ? (asTrimmedString(req.body.description) || null) : undefined,
            status: req.body.status,
            provider: normalizedProvider,
        };

        if (normalizedProvider === 'JITSI') {
            const resolvedRoomName = sanitizeRoomName(req.body.roomName) || liveClass.roomName || buildGeneratedRoomName(nextBatchId);
            const resolvedJitsiDomain = normalizeJitsiDomain(req.body.jitsiDomain || liveClass.jitsiDomain || DEFAULT_JITSI_DOMAIN);
            updates.roomName = resolvedRoomName;
            updates.jitsiDomain = resolvedJitsiDomain;
            updates.joinPath = liveClass.joinPath || buildLiveClassJoinPath(liveClass.id);
            updates.meetingLink = buildJitsiMeetingLink(resolvedJitsiDomain, resolvedRoomName);
        } else {
            const resolvedMeetingLink = req.body.meetingLink !== undefined
                ? asTrimmedString(req.body.meetingLink)
                : asTrimmedString(liveClass.meetingLink);

            if (!resolvedMeetingLink) {
                return res.status(400).json({ message: 'meetingLink is required for external live classes' });
            }

            updates.meetingLink = resolvedMeetingLink;
            updates.roomName = null;
            updates.jitsiDomain = null;
            updates.joinPath = null;
        }

        Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

        await liveClass.update(updates);
        const updated = await LiveClass.findByPk(liveClass.id, { include: liveClassInclude });
        await createStudentNotification({ FacultyId, liveClass: updated, action: 'updated' });

        res.json({ message: 'Live class updated successfully', liveClass: updated });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error updating live class' });
    }
};

export const cancelLiveClass = async (req: any, res: Response) => {
    try {
        if (!(await isLiveClassTableReady())) {
            return res.status(503).json({ message: 'Live classes database table is not ready yet' });
        }

        const FacultyId = req.user.id;
        const liveClassId = req.params.liveClassId as string;
        const liveClass = await LiveClass.findOne({ where: { id: liveClassId, FacultyId } });
        if (!liveClass) return res.status(404).json({ message: 'Live class not found' });

        await liveClass.update({ status: 'CANCELLED' });
        const cancelled = await LiveClass.findByPk(liveClass.id, { include: liveClassInclude });
        await createStudentNotification({ FacultyId, liveClass: cancelled, action: 'cancelled' });

        res.json({ message: 'Live class cancelled successfully', liveClass: cancelled });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error cancelling live class' });
    }
};

export const getStudentLiveClasses = async (req: any, res: Response) => {
    try {
        if (!(await isLiveClassTableReady())) {
            return res.json([]);
        }

        const studentId = req.user.id;
        const enrollments = await Enrollment.findAll({ where: { studentId }, attributes: ['batchId'] });
        const batchIds = enrollments.map((enrollment: any) => enrollment.batchId);

        if (!batchIds.length) {
            return res.json([]);
        }

        const liveClasses = await LiveClass.findAll({
            where: { batchId: { [Op.in]: batchIds } },
            include: liveClassInclude,
            order: [['scheduledAt', 'ASC']],
        });

        res.json(liveClasses);
    } catch (error) {
        console.error('Fetch student live classes error:', error);
        res.status(500).json({ message: 'Error fetching live classes' });
    }
};

export const completeLiveClass = async (req: any, res: Response) => {
    try {
        if (!(await isLiveClassTableReady())) {
            return res.status(503).json({ message: 'Live classes database table is not ready yet' });
        }

        const FacultyId = req.user.id;
        const liveClassId = req.params.liveClassId as string;
        const liveClass = await LiveClass.findOne({ where: { id: liveClassId, FacultyId } });
        if (!liveClass) return res.status(404).json({ message: 'Live class not found' });

        await liveClass.update({ status: 'COMPLETED' });
        const completed = await LiveClass.findByPk(liveClass.id, { include: liveClassInclude });
        await createStudentNotification({ FacultyId, liveClass: completed, action: 'completed' });

        res.json({ message: 'Live class ended successfully', liveClass: completed });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error ending live class' });
    }
};

export const getFacultyLiveClassById = async (req: any, res: Response) => {
    try {
        if (!(await isLiveClassTableReady())) {
            return res.status(503).json({ message: 'Live classes database table is not ready yet' });
        }

        const FacultyId = req.user.id;
        const liveClass = await LiveClass.findOne({
            where: { id: req.params.liveClassId, FacultyId },
            include: liveClassInclude,
        });

        if (!liveClass) {
            return res.status(404).json({ message: 'Live class not found' });
        }

        res.json(liveClass);
    } catch (error) {
        console.error('Fetch Faculty live class detail error:', error);
        res.status(500).json({ message: 'Error fetching live class' });
    }
};

export const getStudentLiveClassById = async (req: any, res: Response) => {
    try {
        if (!(await isLiveClassTableReady())) {
            return res.status(503).json({ message: 'Live classes database table is not ready yet' });
        }

        const studentId = req.user.id;
        const liveClass = await LiveClass.findByPk(req.params.liveClassId, {
            include: liveClassInclude,
        });

        if (!liveClass) {
            return res.status(404).json({ message: 'Live class not found' });
        }

        const enrollment = await Enrollment.findOne({
            where: { studentId, batchId: (liveClass as any).batchId },
            attributes: ['id'],
        });

        if (!enrollment) {
            return res.status(403).json({ message: 'You do not have access to this live class' });
        }

        res.json(liveClass);
    } catch (error) {
        console.error('Fetch student live class detail error:', error);
        res.status(500).json({ message: 'Error fetching live class' });
    }
};
