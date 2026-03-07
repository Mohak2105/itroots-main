import { Response } from 'express';
import { Op } from 'sequelize';
import Batch from '../models/Batch';
import User from '../models/User';
import Enrollment from '../models/Enrollment';
import BatchContent from '../models/BatchContent';
import Test from '../models/Test';
import TestResult from '../models/TestResult';
import Attendance from '../models/Attendance';
import Announcement from '../models/Announcement';
import Course from '../models/Course';
import Payment from '../models/Payment';
import NotificationRecipient from '../models/NotificationRecipient';
import Notification from '../models/Notification';
import LiveClass from '../models/LiveClass';
import Certificate from '../models/Certificate';
import { isLiveClassTableReady } from '../utils/liveClassSchema';
import { streamCertificatePdf } from '../utils/certificatePdf';

const DEFAULT_PROGRESS_PERCENT = 0;

const certificateInclude = [
    { model: Course, as: 'course', attributes: ['id', 'title', 'duration', 'category'] },
    { model: Batch, as: 'batch', attributes: ['id', 'name', 'schedule'] },
    { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
    { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
];

function mapEnrollment(enrollment: any) {
    return {
        ...enrollment.toJSON(),
        progressPercent: DEFAULT_PROGRESS_PERCENT,
    };
}

const getStudentPaymentSummary = async (studentId: string) => {
    const enrollments = await Enrollment.findAll({
        where: { studentId },
        include: [{ model: Batch, as: 'batch', include: [{ model: Course, as: 'course' }] }],
    });

    const totalCourseFees = enrollments.reduce((sum: number, enrollment: any) => sum + Number(enrollment.batch?.course?.price || 0), 0);
    const totalPaid = Number(await Payment.sum('amount', {
        where: { studentId, status: { [Op.in]: ['PAID', 'PARTIAL'] } },
    }) || 0);

    return {
        totalCourseFees,
        totalPaid,
        pendingFees: Math.max(totalCourseFees - totalPaid, 0),
    };
};

export const getStudentDashboard = async (req: any, res: Response) => {
    try {
        const studentId = req.user.id;
        const enrollments = await Enrollment.findAll({
            where: { studentId },
            include: [{
                model: Batch,
                as: 'batch',
                include: [
                    { model: Course, as: 'course', attributes: ['id', 'title', 'slug', 'price'] },
                    { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] },
                ],
            }],
            order: [['createdAt', 'DESC']],
        });

        const mappedEnrollments = enrollments.map(mapEnrollment);
        const batchIds = enrollments.map((enrollment: any) => enrollment.batchId);

        const liveClassReady = await isLiveClassTableReady();
        const [attendanceRecords, announcements, testResults, notifications, paymentSummary, upcomingLiveClasses, upcomingLiveClassCount, certificates, certificateCount] = await Promise.all([
            Attendance.findAll({ where: { studentId } }),
            Announcement.findAll({
                where: { [Op.or]: [{ batchId: null }, ...(batchIds.length ? [{ batchId: batchIds }] : [])] },
                include: [
                    { model: User, as: 'author', attributes: ['name', 'role'] },
                    { model: Batch, as: 'batch', attributes: ['id', 'name'] },
                ],
                order: [['createdAt', 'DESC']],
                limit: 5,
            }),
            TestResult.findAll({
                where: { studentId },
                include: [{ model: Test, as: 'test', attributes: ['totalMarks'] }],
            }),
            NotificationRecipient.findAll({
                where: { userId: studentId },
                include: [{ model: Notification, as: 'notification', include: [{ model: User, as: 'creator', attributes: ['name', 'role'] }] }],
                order: [['createdAt', 'DESC']],
                limit: 5,
            }),
            getStudentPaymentSummary(studentId),
            liveClassReady && batchIds.length ? LiveClass.findAll({
                where: {
                    batchId: { [Op.in]: batchIds },
                    status: 'SCHEDULED',
                    scheduledAt: { [Op.gte]: new Date() },
                },
                include: [
                    { model: Course, as: 'course', attributes: ['id', 'title', 'slug'] },
                    { model: Batch, as: 'batch', attributes: ['id', 'name'] },
                    { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] },
                ],
                order: [['scheduledAt', 'ASC']],
                limit: 5,
            }) : [],
            liveClassReady && batchIds.length ? LiveClass.count({
                where: {
                    batchId: { [Op.in]: batchIds },
                    status: 'SCHEDULED',
                    scheduledAt: { [Op.gte]: new Date() },
                },
            }) : 0,
            Certificate.findAll({
                where: { studentId },
                include: certificateInclude,
                order: [['issueDate', 'DESC']],
                limit: 3,
            }),
            Certificate.count({ where: { studentId } }),
        ]);

        const attendancePercentage = attendanceRecords.length
            ? Math.round((attendanceRecords.filter((record: any) => record.status === 'PRESENT').length / attendanceRecords.length) * 100)
            : 0;

        const averageTestScore = testResults.length
            ? Math.round(testResults.reduce((sum: number, result: any) => {
                const totalMarks = result.test?.totalMarks || 100;
                return sum + (result.score / totalMarks) * 100;
            }, 0) / testResults.length)
            : 0;

        res.json({
            summary: {
                enrolledBatches: mappedEnrollments.length,
                attendancePercentage,
                averageTestScore,
                pendingAssignments: 0,
                pendingFees: paymentSummary.pendingFees,
                upcomingLiveClasses: upcomingLiveClassCount,
                totalCertificates: certificateCount,
            },
            enrollments: mappedEnrollments,
            announcements,
            notifications,
            paymentSummary,
            liveClasses: upcomingLiveClasses,
            certificates,
        });
    } catch (error) {
        console.error('Fetch student dashboard error:', error);
        res.status(500).json({ message: 'Error fetching dashboard' });
    }
};

export const getAvailableBatches = async (req: any, res: Response) => {
    try {
        const studentId = req.user.id;
        const existingEnrollments = await Enrollment.findAll({ where: { studentId }, attributes: ['batchId'] });
        const enrolledBatchIds = existingEnrollments.map((enrollment: any) => enrollment.batchId);

        const batches = await Batch.findAll({
            include: [
                { model: Course, as: 'course', attributes: ['id', 'title', 'slug'] },
                { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] },
            ],
            order: [['startDate', 'ASC']],
        });

        res.json(batches.map((batch: any) => ({ ...batch.toJSON(), isEnrolled: enrolledBatchIds.includes(batch.id) })));
    } catch (error) {
        console.error('Fetch global batches error:', error);
        res.status(500).json({ message: 'Error fetching global batches' });
    }
};

export const selfEnroll = async (req: any, res: Response) => {
    try {
        const studentId = req.user.id;
        const { batchId } = req.body;

        const existing = await Enrollment.findOne({ where: { studentId, batchId } });
        if (existing) return res.status(400).json({ message: 'Already enrolled in this batch' });

        const enrollment = await Enrollment.create({ studentId, batchId, enrollmentDate: new Date(), status: 'ACTIVE' });
        res.status(201).json({ success: true, data: enrollment });
    } catch (error) {
        console.error('Self enrollment error:', error);
        res.status(500).json({ message: 'Error during enrollment' });
    }
};

export const getMyLearning = async (req: any, res: Response) => {
    try {
        const studentId = req.user.id;
        const enrollments = await Enrollment.findAll({
            where: { studentId },
            include: [{ model: Batch, as: 'batch', include: [
                { model: Course, as: 'course', attributes: ['id', 'title', 'slug'] },
                { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] },
            ] }],
            order: [['createdAt', 'DESC']],
        });

        res.json(enrollments.map(mapEnrollment));
    } catch (error) {
        console.error('Fetch my learning error:', error);
        res.status(500).json({ message: 'Error fetching learning modules' });
    }
};

export const getBatchResources = async (req: any, res: Response) => {
    try {
        const studentId = req.user.id;
        const { batchId } = req.params;
        const requestedType = typeof req.query.type === 'string' ? req.query.type.toUpperCase() : null;

        if (batchId) {
            const enrollment = await Enrollment.findOne({ where: { studentId, batchId } });
            if (!enrollment) return res.status(403).json({ message: 'Access denied: Enroll in this batch first' });

            const contentsWhere: any = { batchId };
            if (requestedType) contentsWhere.type = requestedType;

            const [contents, tests] = await Promise.all([
                BatchContent.findAll({ where: contentsWhere, order: [['createdAt', 'DESC']] }),
                Test.findAll({ where: { batchId }, order: [['createdAt', 'DESC']] }),
            ]);

            return res.json({ contents, tests });
        }

        const enrollments = await Enrollment.findAll({ where: { studentId }, attributes: ['batchId'] });
        const batchIds = enrollments.map((enrollment: any) => enrollment.batchId);
        if (!batchIds.length) return res.json({ success: true, data: [] });

        const contentWhere: any = { batchId: batchIds };
        if (requestedType) contentWhere.type = requestedType;

        const resources = await BatchContent.findAll({
            where: contentWhere,
            include: [{ model: Batch, as: 'batch', attributes: ['id', 'name'], include: [{ model: Course, as: 'course', attributes: ['title'] }] }],
            order: [['createdAt', 'DESC']],
        });

        res.json({
            success: true,
            data: resources.map((resource: any) => ({
                id: resource.id,
                title: resource.title,
                subject: resource.batch?.course?.title || resource.batch?.name,
                fileType: resource.type,
                fileUrl: resource.contentUrl,
                uploadedAt: resource.createdAt,
                batchId: resource.batchId,
            })),
        });
    } catch (error) {
        console.error('Fetch resources error:', error);
        res.status(500).json({ message: 'Error fetching batch materials' });
    }
};

export const submitExamResult = async (req: any, res: Response) => {
    try {
        const studentId = req.user.id;
        const { testId, score, completionTime } = req.body;
        const result = await TestResult.create({ studentId, testId, score, completionTime, submittedAt: new Date() });
        res.status(201).json(result);
    } catch (error) {
        console.error('Submit exam error:', error);
        res.status(500).json({ message: 'Error submitting test' });
    }
};

export const getMyCertificates = async (req: any, res: Response) => {
    try {
        const studentId = req.user.id;
        const certificates = await Certificate.findAll({
            where: { studentId },
            include: certificateInclude,
            order: [['issueDate', 'DESC']],
        });
        res.json(certificates);
    } catch (error) {
        console.error('Fetch student certificates error:', error);
        res.status(500).json({ message: 'Error fetching certificates' });
    }
};

export const downloadMyCertificate = async (req: any, res: Response) => {
    try {
        const studentId = req.user.id;
        const certificate = await Certificate.findOne({
            where: { id: req.params.id, studentId },
            include: certificateInclude,
        });

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        streamCertificatePdf(res, certificate);
    } catch (error: any) {
        console.error('Download student certificate error:', error);
        res.status(500).json({ message: error.message || 'Error downloading certificate' });
    }
};
