import { Response } from 'express';
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
    action: 'created' | 'updated' | 'cancelled';
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

    const titlePrefix = action === 'created' ? 'New Live Class' : action === 'updated' ? 'Live Class Updated' : 'Live Class Cancelled';
    const title = `${titlePrefix}: ${liveClass.title}`;
    const message = [
        `${liveClass.title}`,
        `Course: ${liveClass.course?.title || 'Course'}`,
        `Batch: ${liveClass.batch?.name || 'Batch'}`,
        `Date and Time: ${scheduledAt}`,
        action === 'cancelled' ? 'Status: Cancelled' : `Meeting Link: ${liveClass.meetingLink}`,
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
        const { title, courseId, batchId, scheduledAt, meetingLink, description } = req.body;
        if (!title || !courseId || !batchId || !scheduledAt || !meetingLink) {
            await transaction.rollback();
            return res.status(400).json({ message: 'title, courseId, batchId, scheduledAt and meetingLink are required' });
        }

        await ensureFacultyBatchAccess(FacultyId, batchId, courseId);

        const liveClass = await LiveClass.create({
            title,
            courseId,
            batchId,
            FacultyId,
            scheduledAt,
            meetingLink,
            description,
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

        const updates: any = {
            title: req.body.title,
            courseId: req.body.courseId,
            batchId: req.body.batchId,
            scheduledAt: req.body.scheduledAt,
            meetingLink: req.body.meetingLink,
            description: req.body.description,
            status: req.body.status,
        };
        Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

        const nextCourseId = updates.courseId || liveClass.courseId;
        const nextBatchId = updates.batchId || liveClass.batchId;
        await ensureFacultyBatchAccess(FacultyId, nextBatchId, nextCourseId);

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
