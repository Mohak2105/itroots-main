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
import { clearStudentNotificationsForLiveClass } from '../utils/liveClassNotifications';
import { createZoomMeetingSignature, parseZoomMeetingDetails } from '../utils/zoom';

const asTrimmedString = (value: any) => String(value ?? '').trim();

const resolveLiveClassProvider = (value: any) => {
    const normalized = asTrimmedString(value).toUpperCase();
    if (normalized === 'ZOOM') return 'ZOOM' as const;
    if (normalized === 'JITSI') return 'JITSI' as const;
    return 'EXTERNAL' as const;
};

const buildLiveClassJoinPath = (liveClassId: string) => `/lms/student/live-classes/${liveClassId}`;
const isEmbeddedLiveClassProvider = (provider: string) => provider === 'ZOOM' || provider === 'JITSI';
const LIVE_CLASS_SESSION_WINDOW_MS = 120 * 60 * 1000;

const getJitsiRoomPrefix = () => {
    const normalized = asTrimmedString(process.env.JITSI_ROOM_PREFIX)
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return normalized || 'itroots-live';
};

const buildJitsiRoomName = (liveClassId: string) => (
    `${getJitsiRoomPrefix()}-${liveClassId.replace(/[^a-z0-9]/gi, '').toLowerCase()}`
);

const parseScheduledAt = (value: any) => {
    const normalized = asTrimmedString(value);
    if (!normalized) return null;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return null;
    return date;
};

const ensureLiveClassJoinWindow = (liveClass: any) => {
    const status = asTrimmedString(liveClass?.status).toUpperCase();
    if (status === 'CANCELLED') {
        throw new Error('This live class has been cancelled');
    }

    if (status === 'COMPLETED') {
        throw new Error('This live class has ended');
    }

    const scheduledAt = parseScheduledAt(liveClass?.scheduledAt);
    if (!scheduledAt) {
        throw new Error('This live class schedule is invalid');
    }

    const scheduledTime = scheduledAt.getTime();
    const now = Date.now();
    if (now < scheduledTime) {
        throw new Error('Class has not started yet');
    }

    if (now > scheduledTime + LIVE_CLASS_SESSION_WINDOW_MS) {
        throw new Error('Class session expired');
    }
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
    await clearStudentNotificationsForLiveClass(liveClass);

    if (action === 'cancelled' || action === 'completed') {
        return;
    }

    const enrollments = await Enrollment.findAll({
        where: { batchId: liveClass.batchId },
        include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email'] }],
    });

    const recipients = enrollments
        .map((enrollment: any) => enrollment.student)
        .filter((student: any) => student?.id);

    if (!recipients.length) return;

    const titlePrefix = action === 'created'
        ? 'Live Class Started'
        : action === 'updated'
            ? 'Live Class Updated'
            : 'Live Class Started';
    const title = `${titlePrefix}: ${liveClass.title}`;
    const joinLine = isEmbeddedLiveClassProvider(String(liveClass.provider || '').toUpperCase()) && liveClass.joinPath
        ? `Join in LMS: ${liveClass.joinPath}`
        : `Meeting Link: ${liveClass.meetingLink}`;
    const message = [
        `${liveClass.title}`,
        `Course: ${liveClass.course?.title || 'Course'}`,
        `Batch: ${liveClass.batch?.name || 'Batch'}`,
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
        const { title, courseId, batchId, scheduledAt, meetingLink, description, provider, passcode } = req.body;
        const normalizedTitle = asTrimmedString(title);
        const normalizedDescription = asTrimmedString(description) || null;
        const normalizedScheduledAt = asTrimmedString(scheduledAt)
            ? parseScheduledAt(scheduledAt)
            : new Date();
        const normalizedProvider = resolveLiveClassProvider(provider);
        const resolvedMeetingLink = normalizedProvider === 'JITSI'
            ? ''
            : asTrimmedString(meetingLink);
        if (!normalizedTitle || !courseId || !batchId || !normalizedScheduledAt) {
            await transaction.rollback();
            return res.status(400).json({ message: 'title, courseId, batchId and a valid scheduledAt are required' });
        }
        if (normalizedProvider !== 'JITSI' && !resolvedMeetingLink) {
            await transaction.rollback();
            return res.status(400).json({ message: 'meetingLink is required for Zoom and external live classes' });
        }

        await ensureFacultyBatchAccess(FacultyId, batchId, courseId);

        const liveClassId = randomUUID();
        const zoomDetails = normalizedProvider === 'ZOOM'
            ? parseZoomMeetingDetails(resolvedMeetingLink, passcode)
            : null;

        const liveClass = await LiveClass.create({
            id: liveClassId,
            title: normalizedTitle,
            courseId,
            batchId,
            FacultyId,
            scheduledAt: normalizedScheduledAt,
            meetingLink: resolvedMeetingLink,
            provider: normalizedProvider,
            zoomMeetingNumber: zoomDetails?.meetingNumber || null,
            zoomPasscode: zoomDetails?.passcode || null,
            jitsiRoomName: normalizedProvider === 'JITSI' ? buildJitsiRoomName(liveClassId) : null,
            joinPath: isEmbeddedLiveClassProvider(normalizedProvider) ? buildLiveClassJoinPath(liveClassId) : null,
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

        const normalizedProvider = resolveLiveClassProvider(req.body.provider ?? liveClass.provider);
        const currentProvider = resolveLiveClassProvider(liveClass.provider);
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

        const resolvedMeetingLink = req.body.meetingLink !== undefined
            ? asTrimmedString(req.body.meetingLink)
            : asTrimmedString(liveClass.meetingLink);
        const finalMeetingLink = normalizedProvider === 'JITSI' ? '' : resolvedMeetingLink;
        const zoomDetails = normalizedProvider === 'ZOOM'
            ? parseZoomMeetingDetails(finalMeetingLink, req.body.passcode ?? (liveClass as any).zoomPasscode)
            : null;
        const existingJitsiRoomName = asTrimmedString((liveClass as any).jitsiRoomName);
        const nextJitsiRoomName = normalizedProvider === 'JITSI'
            ? (currentProvider === 'JITSI' && existingJitsiRoomName ? existingJitsiRoomName : buildJitsiRoomName(liveClass.id))
            : null;

        const updates: any = {
            title: normalizedUpdatedTitle,
            courseId: req.body.courseId,
            batchId: req.body.batchId,
            scheduledAt: normalizedScheduledAt,
            description: req.body.description !== undefined ? (asTrimmedString(req.body.description) || null) : undefined,
            status: req.body.status,
            provider: normalizedProvider,
            meetingLink: finalMeetingLink,
            zoomMeetingNumber: zoomDetails?.meetingNumber || null,
            zoomPasscode: zoomDetails?.passcode || null,
            jitsiRoomName: nextJitsiRoomName,
            joinPath: isEmbeddedLiveClassProvider(normalizedProvider) ? (liveClass.joinPath || buildLiveClassJoinPath(liveClass.id)) : null,
        };
        if (normalizedProvider !== 'JITSI' && !updates.meetingLink) {
            return res.status(400).json({ message: 'meetingLink is required for Zoom and external live classes' });
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
            where: {
                batchId: { [Op.in]: batchIds },
                status: 'SCHEDULED',
                scheduledAt: { [Op.gte]: new Date(Date.now() - LIVE_CLASS_SESSION_WINDOW_MS) },
            },
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

const buildZoomSignatureResponse = (liveClass: any) => {
    if (!liveClass) {
        throw new Error('Live class not found');
    }

    if (String(liveClass.provider || '').toUpperCase() !== 'ZOOM') {
        throw new Error('Zoom signature is only available for Zoom live classes');
    }

    ensureLiveClassJoinWindow(liveClass);

    const meetingNumber = asTrimmedString((liveClass as any).zoomMeetingNumber);
    if (!meetingNumber) {
        throw new Error('Zoom meeting number is missing for this live class');
    }

    const { sdkKey, signature } = createZoomMeetingSignature({
        meetingNumber,
        role: 0,
    });

    return {
        sdkKey,
        signature,
        meetingNumber,
        password: asTrimmedString((liveClass as any).zoomPasscode),
        meetingLink: asTrimmedString(liveClass.meetingLink),
    };
};

export const getFacultyLiveClassZoomSignature = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;
        const liveClass = await LiveClass.findOne({ where: { id: req.params.liveClassId, FacultyId } });
        if (!liveClass) {
            return res.status(404).json({ message: 'Live class not found' });
        }

        res.json(buildZoomSignatureResponse(liveClass));
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Unable to create Zoom signature' });
    }
};

export const getStudentLiveClassZoomSignature = async (req: any, res: Response) => {
    try {
        const studentId = req.user.id;
        const liveClass = await LiveClass.findByPk(req.params.liveClassId);

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

        res.json(buildZoomSignatureResponse(liveClass));
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Unable to create Zoom signature' });
    }
};
