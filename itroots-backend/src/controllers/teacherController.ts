import { Response } from 'express';
import fs from 'fs';
import path from 'path';
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
import AssignmentSubmission from '../models/AssignmentSubmission';
import { isLiveClassTableReady } from '../utils/liveClassSchema';

const MCQ_OPTION_COUNT = 4;

const ensureUploadDir = () => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'batch-content');
    fs.mkdirSync(uploadDir, { recursive: true });
    return uploadDir;
};

const sanitizeFileName = (fileName: string) => fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

const saveBatchContentFile = ({ fileName, fileData }: { fileName: string; fileData: string }) => {
    if (!fileName || !fileData) {
        throw new Error('Uploaded file payload is incomplete');
    }

    const uploadDir = ensureUploadDir();
    const safeName = sanitizeFileName(fileName);
    const extension = path.extname(safeName);
    const baseName = path.basename(safeName, extension);
    const finalFileName = `${baseName}-${Date.now()}${extension}`;
    const targetPath = path.join(uploadDir, finalFileName);

    const matches = fileData.match(/^data:(.+);base64,(.+)$/);
    const base64Payload = matches ? matches[2] : fileData;
    fs.writeFileSync(targetPath, Buffer.from(base64Payload, 'base64'));

    return `/uploads/batch-content/${finalFileName}`;
};

const normalizeMcqQuestions = (questions: any) => {
    if (!Array.isArray(questions) || !questions.length) {
        throw new Error('At least one MCQ question is required');
    }

    return questions.map((question: any, index: number) => {
        const text = String(question?.text || '').trim();
        const options = Array.isArray(question?.options)
            ? question.options.slice(0, MCQ_OPTION_COUNT).map((option: any) => String(option || '').trim())
            : [];
        const correctIndex = Number(question?.correctIndex);

        if (!text) {
            throw new Error(`Question ${index + 1} text is required`);
        }

        if (options.length !== MCQ_OPTION_COUNT || options.some((option: string) => !option)) {
            throw new Error(`Question ${index + 1} must have exactly ${MCQ_OPTION_COUNT} options`);
        }

        if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= MCQ_OPTION_COUNT) {
            throw new Error(`Question ${index + 1} must have one correct option selected`);
        }

        return {
            id: String(question?.id || `q-${index + 1}`),
            text,
            options,
            correctIndex,
        };
    });
};

export const getFacultyDashboard = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;
        const batches = await Batch.findAll({
            where: { FacultyId },
            include: [{ model: Course, as: 'course', attributes: ['id', 'title', 'slug'] }],
            order: [['startDate', 'ASC']],
        });

        const batchIds = batches.map((batch: any) => batch.id);
        const liveClassReady = await isLiveClassTableReady();
        const [totalStudents, totalTests, totalContents, notifications, pendingAssignmentReviews, upcomingLiveClassCount, upcomingLiveClasses] = await Promise.all([
            batchIds.length ? Enrollment.count({ where: { batchId: batchIds } }) : 0,
            batchIds.length ? Test.count({ where: { batchId: batchIds } }) : 0,
            batchIds.length ? BatchContent.count({ where: { batchId: batchIds } }) : 0,
            NotificationRecipient.findAll({
                where: { userId: FacultyId },
                include: [{ model: Notification, as: 'notification', include: [{ model: User, as: 'creator', attributes: ['name', 'role'] }] }],
                order: [['createdAt', 'DESC']],
                limit: 5,
            }),
            batchIds.length ? AssignmentSubmission.count({ where: { batchId: batchIds, status: 'SUBMITTED' } }) : 0,
            liveClassReady ? LiveClass.count({
                where: {
                    FacultyId,
                    status: 'SCHEDULED',
                    scheduledAt: { [Op.gte]: new Date() },
                },
            }) : 0,
            liveClassReady ? LiveClass.findAll({
                where: {
                    FacultyId,
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
                pendingAssignmentReviews,
                upcomingLiveClasses: upcomingLiveClassCount,
            },
            batches,
            notifications,
            liveClasses: upcomingLiveClasses,
        });
    } catch (error) {
        console.error('Fetch Faculty dashboard error:', error);
        res.status(500).json({ message: 'Error fetching dashboard' });
    }
};

export const getMyBatches = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;
        const batches = await Batch.findAll({ where: { FacultyId }, include: ['course'] });
        res.json(batches);
    } catch (error) {
        console.error('Fetch my batches error:', error);
        res.status(500).json({ message: 'Error fetching batches' });
    }
};

export const getBatchData = async (req: any, res: Response) => {
    try {
        const { batchId } = req.params;
        const FacultyId = req.user.id;

        const batch = await Batch.findOne({
            where: { id: batchId, FacultyId },
            include: [
                { model: Course, as: 'course', attributes: ['id', 'title', 'slug'] },
                { model: User, as: 'Faculty', attributes: ['id', 'name', 'email'] },
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
    FacultyId,
    batch,
    title,
    message,
}: {
    FacultyId: string;
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
        createdBy: FacultyId,
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
        const FacultyId = req.user.id;
        const { batchId, title, description, contentUrl, fileData, fileName } = req.body;
        const type = typeof req.body.type === 'string' ? req.body.type.toUpperCase() : req.body.type;

        const batch = await Batch.findOne({
            where: { id: batchId, FacultyId },
            include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }],
        });

        if (!batch) {
            return res.status(404).json({ message: 'Batch not found for this Faculty' });
        }

        let resolvedContentUrl = String(contentUrl || '').trim();
        if (type !== 'VIDEO' && fileData && fileName) {
            resolvedContentUrl = saveBatchContentFile({ fileName, fileData });
        }

        if (!resolvedContentUrl) {
            return res.status(400).json({ message: type === 'VIDEO' ? 'Video URL is required' : 'Assignment or resource file/URL is required' });
        }

        const content = await BatchContent.create({ batchId, title, description, type, contentUrl: resolvedContentUrl });

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
            type === 'VIDEO' ? `Watch here: ${resolvedContentUrl}` : `Open here: ${resolvedContentUrl}`,
            description ? `Details: ${description}` : null,
        ].filter(Boolean).join('\n');

        await createBatchStudentNotification({
            FacultyId,
            batch,
            title: notificationTitle,
            message: notificationMessage,
        });

        res.status(201).json(content);
    } catch (error: any) {
        console.error('Add batch content error:', error);
        res.status(500).json({ message: error.message || 'Error adding content' });
    }
};

export const createTest = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;
        const { batchId, title, description, totalMarks, durationMinutes, questions } = req.body;

        if (!batchId || !title) {
            return res.status(400).json({ message: 'batchId and title are required' });
        }

        const batch = await Batch.findOne({
            where: { id: batchId, FacultyId },
            include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }],
        });

        if (!batch) {
            return res.status(404).json({ message: 'Batch not found for this Faculty' });
        }

        const normalizedQuestions = normalizeMcqQuestions(questions);
        const normalizedTotalMarks = Number(totalMarks || normalizedQuestions.length);
        const normalizedDurationMinutes = Number(durationMinutes || 60);

        if (!Number.isFinite(normalizedTotalMarks) || normalizedTotalMarks <= 0) {
            return res.status(400).json({ message: 'totalMarks must be greater than zero' });
        }

        if (!Number.isFinite(normalizedDurationMinutes) || normalizedDurationMinutes <= 0) {
            return res.status(400).json({ message: 'durationMinutes must be greater than zero' });
        }

        const test = await Test.create({
            batchId,
            title,
            description,
            totalMarks: normalizedTotalMarks,
            durationMinutes: normalizedDurationMinutes,
            questions: normalizedQuestions,
        });

        const courseTitle = (batch as any).course?.title || 'Course';
        const batchName = (batch as any).name || 'Batch';
        const notificationMessage = [
            `${title}`,
            `Course: ${courseTitle}`,
            `Batch: ${batchName}`,
            `Questions: ${normalizedQuestions.length}`,
            `Duration: ${normalizedDurationMinutes} minutes`,
            `Total Marks: ${normalizedTotalMarks}`,
            description ? `Details: ${description}` : null,
        ].filter(Boolean).join('\n');

        await createBatchStudentNotification({
            FacultyId,
            batch,
            title: `New Test Available: ${title}`,
            message: notificationMessage,
        });

        res.status(201).json(test);
    } catch (error: any) {
        console.error('Create test error:', error);
        res.status(500).json({ message: error.message || 'Error creating test' });
    }
};

export const getTestResults = async (req: any, res: Response) => {
    try {
        const { testId } = req.params;
        const results = await TestResult.findAll({
            where: { testId },
            include: [{ model: User, as: 'student', attributes: ['name', 'email'] }],
            order: [['submittedAt', 'DESC']],
        });
        res.json(results);
    } catch (error) {
        console.error('Fetch test results error:', error);
        res.status(500).json({ message: 'Error fetching analysis' });
    }
};

export const getFacultyAssignments = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;

        const assignments = await BatchContent.findAll({
            where: { type: 'ASSIGNMENT' },
            include: [
                {
                    model: Batch,
                    as: 'batch',
                    where: { FacultyId },
                    attributes: ['id', 'name'],
                    include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }],
                },
                {
                    model: AssignmentSubmission,
                    as: 'submissions',
                    required: false,
                    include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email'] }],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json(assignments.map((assignment: any) => ({
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            contentUrl: assignment.contentUrl,
            createdAt: assignment.createdAt,
            batchId: assignment.batchId,
            batchName: assignment.batch?.name || 'Batch',
            courseName: assignment.batch?.course?.title || 'Course',
            submissionStats: {
                total: assignment.submissions?.length || 0,
                pending: assignment.submissions?.filter((item: any) => item.status === 'SUBMITTED').length || 0,
                reviewed: assignment.submissions?.filter((item: any) => item.status === 'REVIEWED').length || 0,
            },
            submissions: (assignment.submissions || [])
                .sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                .map((submission: any) => ({
                    id: submission.id,
                    studentId: submission.studentId,
                    studentName: submission.student?.name || 'Student',
                    studentEmail: submission.student?.email || '',
                    fileUrl: submission.fileUrl,
                    fileName: submission.fileName,
                    notes: submission.notes,
                    status: submission.status,
                    grade: submission.grade,
                    feedback: submission.feedback,
                    submittedAt: submission.submittedAt,
                })),
        })));
    } catch (error) {
        console.error('Fetch Faculty assignments error:', error);
        res.status(500).json({ message: 'Error fetching assignments' });
    }
};

export const reviewAssignmentSubmission = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;
        const { submissionId } = req.params;
        const { grade, feedback } = req.body;

        const submission = await AssignmentSubmission.findByPk(submissionId, {
            include: [
                {
                    model: Batch,
                    as: 'batch',
                    attributes: ['id', 'name', 'FacultyId'],
                    include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }],
                },
                { model: BatchContent, as: 'assignment', attributes: ['id', 'title'] },
                { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
            ],
        });

        if (!submission) {
            return res.status(404).json({ message: 'Assignment submission not found' });
        }

        if ((submission as any).batch?.FacultyId !== FacultyId) {
            return res.status(403).json({ message: 'You do not have access to review this submission' });
        }

        const normalizedGrade = grade === '' || grade === null || grade === undefined ? null : Number(grade);
        if (normalizedGrade !== null && (!Number.isFinite(normalizedGrade) || normalizedGrade < 0)) {
            return res.status(400).json({ message: 'grade must be a valid non-negative number' });
        }

        submission.grade = normalizedGrade;
        submission.feedback = typeof feedback === 'string' ? feedback.trim() : null;
        submission.status = 'REVIEWED';
        await submission.save();

        const batch = (submission as any).batch;
        const assignment = (submission as any).assignment;
        const student = (submission as any).student;

        const notification = await Notification.create({
            title: `Assignment Reviewed: ${assignment?.title || 'Assignment'}`,
            message: [
                `Your submission for ${assignment?.title || 'the assignment'} has been reviewed.`,
                `Course: ${batch?.course?.title || 'Course'}`,
                `Batch: ${batch?.name || 'Batch'}`,
                normalizedGrade !== null ? `Grade: ${normalizedGrade}` : null,
                submission.feedback ? `Feedback: ${submission.feedback}` : null,
            ].filter(Boolean).join('\n'),
            type: 'NOTIFICATION',
            audienceType: 'SELECTED_STUDENTS',
            sendEmail: false,
            createdBy: FacultyId,
            batchId: batch?.id || undefined,
            courseId: batch?.course?.id || undefined,
        });

        await NotificationRecipient.findOrCreate({
            where: {
                notificationId: notification.id,
                userId: submission.studentId,
            },
            defaults: {
                notificationId: notification.id,
                userId: submission.studentId,
                emailSent: false,
            },
        });

        res.json({
            message: 'Submission reviewed successfully',
            submission: {
                id: submission.id,
                grade: submission.grade,
                feedback: submission.feedback,
                status: submission.status,
                submittedAt: submission.submittedAt,
                studentName: student?.name || 'Student',
            },
        });
    } catch (error: any) {
        console.error('Review assignment submission error:', error);
        res.status(500).json({ message: error.message || 'Error reviewing assignment submission' });
    }
};

