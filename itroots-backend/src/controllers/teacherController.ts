import { Response } from 'express';
import { Op } from 'sequelize';
import Batch from '../models/Batch';
import BatchContent from '../models/BatchContent';
import Test from '../models/Test';
import TestResult from '../models/TestResult';
import User from '../models/User';
import Enrollment from '../models/Enrollment';
import Course from '../models/Course';
import NotificationRecipient from '../models/NotificationRecipient';
import Notification from '../models/Notification';
import LiveClass from '../models/LiveClass';
import { isLiveClassTableReady } from '../utils/liveClassSchema';

export const getTeacherDashboard = async (req: any, res: Response) => {
    try {
        const teacherId = req.user.id;
        const batches = await Batch.findAll({
            where: { teacherId },
            include: [{ model: Course, as: 'course', attributes: ['id', 'title', 'slug'] }],
            order: [['startDate', 'ASC']],
        });

        const batchIds = batches.map((batch: any) => batch.id);
        const liveClassReady = await isLiveClassTableReady();
        const [totalStudents, totalTests, totalContents, notifications, upcomingLiveClassCount, upcomingLiveClasses] = await Promise.all([
            batchIds.length ? Enrollment.count({ where: { batchId: batchIds } }) : 0,
            batchIds.length ? Test.count({ where: { batchId: batchIds } }) : 0,
            batchIds.length ? BatchContent.count({ where: { batchId: batchIds } }) : 0,
            NotificationRecipient.findAll({
                where: { userId: teacherId },
                include: [{ model: Notification, as: 'notification', include: [{ model: User, as: 'creator', attributes: ['name', 'role'] }] }],
                order: [['createdAt', 'DESC']],
                limit: 5,
            }),
            liveClassReady ? LiveClass.count({
                where: {
                    teacherId,
                    status: 'SCHEDULED',
                    scheduledAt: { [Op.gte]: new Date() },
                },
            }) : 0,
            liveClassReady ? LiveClass.findAll({
                where: {
                    teacherId,
                    status: 'SCHEDULED',
                    scheduledAt: { [Op.gte]: new Date() },
                },
                include: [
                    { model: Course, as: 'course', attributes: ['id', 'title', 'slug'] },
                    { model: Batch, as: 'batch', attributes: ['id', 'name'] },
                ],
                order: [['scheduledAt', 'ASC']],
                limit: 5,
            }) : [],
        ]);

        res.json({
            summary: {
                totalBatches: batches.length,
                totalStudents,
                totalTests,
                totalContents,
                pendingAssignmentReviews: 0,
                upcomingLiveClasses: upcomingLiveClassCount,
            },
            batches,
            notifications,
            liveClasses: upcomingLiveClasses,
        });
    } catch (error) {
        console.error('Fetch teacher dashboard error:', error);
        res.status(500).json({ message: 'Error fetching dashboard' });
    }
};

export const getMyBatches = async (req: any, res: Response) => {
    try {
        const teacherId = req.user.id;
        const batches = await Batch.findAll({ where: { teacherId }, include: ['course'] });
        res.json(batches);
    } catch (error) {
        console.error('Fetch my batches error:', error);
        res.status(500).json({ message: 'Error fetching batches' });
    }
};

export const getBatchData = async (req: any, res: Response) => {
    try {
        const { batchId } = req.params;
        const teacherId = req.user.id;

        const batch = await Batch.findOne({
            where: { id: batchId, teacherId },
            include: [
                { model: Course, as: 'course', attributes: ['id', 'title', 'slug'] },
                { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] },
            ],
        });

        if (!batch) return res.status(404).json({ message: 'Batch not found' });

        const [contents, tests, enrollments] = await Promise.all([
            BatchContent.findAll({ where: { batchId }, order: [['createdAt', 'DESC']] }),
            Test.findAll({ where: { batchId }, order: [['createdAt', 'DESC']] }),
            Enrollment.findAll({
                where: { batchId },
                include: [{ model: User, as: 'student', attributes: ['id', 'username', 'name', 'email'] }],
                order: [['createdAt', 'DESC']],
            }),
        ]);

        res.json({ success: true, data: { batch, contents, tests, enrollments } });
    } catch (error) {
        console.error('Fetch batch data error:', error);
        res.status(500).json({ message: 'Error fetching batch data' });
    }
};

const createBatchStudentNotification = async ({
    teacherId,
    batch,
    title,
    message,
}: {
    teacherId: string;
    batch: any;
    title: string;
    message: string;
}) => {
    const enrollments = await Enrollment.findAll({
        where: { batchId: batch.id },
        include: [{ model: User, as: 'student', attributes: ['id'] }],
    });

    const recipients = enrollments
        .map((enrollment: any) => enrollment.student?.id)
        .filter(Boolean);

    if (!recipients.length) return;

    const notification = await Notification.create({
        title,
        message,
        type: 'NOTIFICATION',
        audienceType: 'SELECTED_STUDENTS',
        sendEmail: false,
        createdBy: teacherId,
        batchId: batch.id,
        courseId: batch.course?.id || batch.courseId,
    });

    await NotificationRecipient.bulkCreate(
        recipients.map((userId: string) => ({
            notificationId: notification.id,
            userId,
            emailSent: false,
        }))
    );
};

export const addBatchContent = async (req: any, res: Response) => {
    try {
        const teacherId = req.user.id;
        const { batchId, title, description, contentUrl } = req.body;
        const type = typeof req.body.type === 'string' ? req.body.type.toUpperCase() : req.body.type;

        const batch = await Batch.findOne({
            where: { id: batchId, teacherId },
            include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }],
        });

        if (!batch) {
            return res.status(404).json({ message: 'Batch not found for this teacher' });
        }

        const content = await BatchContent.create({ batchId, title, description, type, contentUrl });

        const courseTitle = (batch as any).course?.title || 'Course';
        const batchName = (batch as any).name || 'Batch';
        const notificationTitle = type === 'VIDEO'
            ? `New Video Class: ${title}`
            : type === 'ASSIGNMENT'
                ? `New Assignment: ${title}`
                : `New Study Material: ${title}`;
        const notificationMessage = [
            `${title}`,
            `Course: ${courseTitle}`,
            `Batch: ${batchName}`,
            type === 'VIDEO' ? `Watch here: ${contentUrl}` : `Open here: ${contentUrl}`,
            description ? `Details: ${description}` : null,
        ].filter(Boolean).join('\n');

        await createBatchStudentNotification({
            teacherId,
            batch,
            title: notificationTitle,
            message: notificationMessage,
        });

        res.status(201).json(content);
    } catch (error) {
        console.error('Add batch content error:', error);
        res.status(500).json({ message: 'Error adding content' });
    }
};

export const createTest = async (req: any, res: Response) => {
    try {
        const { batchId, title, description, totalMarks, durationMinutes, questions } = req.body;
        const test = await Test.create({ batchId, title, description, totalMarks, durationMinutes, questions });
        res.status(201).json(test);
    } catch (error) {
        console.error('Create test error:', error);
        res.status(500).json({ message: 'Error creating test' });
    }
};

export const getTestResults = async (req: any, res: Response) => {
    try {
        const { testId } = req.params;
        const results = await TestResult.findAll({
            where: { testId },
            include: [{ model: User, as: 'student', attributes: ['name', 'email'] }],
        });
        res.json(results);
    } catch (error) {
        console.error('Fetch test results error:', error);
        res.status(500).json({ message: 'Error fetching analysis' });
    }
};
