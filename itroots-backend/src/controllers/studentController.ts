import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';
import Batch from '../models/Batch';
import User from '../models/User';
import Enrollment from '../models/Enrollment';
import BatchContent, { getBatchContentReadableAttributes } from '../models/BatchContent';
import Test from '../models/Test';
import TestResult, { TEST_RESULT_BASE_ATTRIBUTES } from '../models/TestResult';
import Attendance from '../models/Attendance';
import Announcement from '../models/Announcement';
import Course from '../models/Course';
import Payment from '../models/Payment';
import NotificationRecipient from '../models/NotificationRecipient';
import Notification from '../models/Notification';
import LiveClass from '../models/LiveClass';
import Certificate from '../models/Certificate';
import AssignmentSubmission, { getAssignmentSubmissionReadableAttributes } from '../models/AssignmentSubmission';
import Placement from '../models/Placement';
import { isLiveClassTableReady } from '../utils/liveClassSchema';
import { streamCertificatePdf } from '../utils/certificatePdf';
import { getStudyMaterialType } from '../utils/studyMaterial';

const DEFAULT_PROGRESS_PERCENT = 0;
const ALLOWED_FORCE_SUBMIT_REASONS = new Set(['TIME_EXPIRED', 'TAB_SWITCH', 'WINDOW_BLUR']);
const asTrimmedViolationReason = (value: any) => String(value ?? '').trim().toUpperCase();

const certificateInclude = [
    { model: Course, as: 'course', attributes: ['id', 'title', 'duration', 'category'] },
    { model: Batch, as: 'batch', attributes: ['id', 'name', 'schedule'] },
    { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
    { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
];

const calculatePercentage = (score: number, totalMarks: number) => {
    if (!Number.isFinite(totalMarks) || totalMarks <= 0) return 0;
    return Math.round((Number(score || 0) / totalMarks) * 100);
};

const resolveAssignmentMaxMarks = (value: any, fallback = 100) => {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) {
        return parsed;
    }
    return fallback;
};

const buildBatchProgressMap = async (studentId: string, batchIds: string[]) => {
    const progressByBatchId = new Map<string, number>();
    if (!batchIds.length) return progressByBatchId;

    const tests = await Test.findAll({
        where: { batchId: { [Op.in]: batchIds } },
        attributes: ['id', 'batchId', 'totalMarks'],
    });

    if (!tests.length) return progressByBatchId;

    const testById = new Map<string, any>();
    tests.forEach((test: any) => testById.set(test.id, test));

    const testResults = await TestResult.findAll({
        where: {
            studentId,
            testId: { [Op.in]: tests.map((test: any) => test.id) },
        },
        attributes: TEST_RESULT_BASE_ATTRIBUTES as unknown as string[],
        order: [['submittedAt', 'DESC']],
    });

    const percentageBuckets = new Map<string, number[]>();
    testResults.forEach((result: any) => {
        const test = testById.get(result.testId);
        if (!test) return;
        const percent = Number.isFinite(Number(result.percentage))
            ? Number(result.percentage)
            : calculatePercentage(Number(result.score || 0), Number(test.totalMarks || 0));
        const list = percentageBuckets.get(test.batchId) || [];
        list.push(percent);
        percentageBuckets.set(test.batchId, list);
    });

    batchIds.forEach((batchId) => {
        const list = percentageBuckets.get(batchId) || [];
        const avg = list.length
            ? Math.round(list.reduce((sum, value) => sum + value, 0) / list.length)
            : DEFAULT_PROGRESS_PERCENT;
        progressByBatchId.set(batchId, avg);
    });

    return progressByBatchId;
};

function mapEnrollment(enrollment: any, progressByBatchId: Map<string, number>) {
    return {
        ...enrollment.toJSON(),
        progressPercent: progressByBatchId.get(enrollment.batchId) ?? DEFAULT_PROGRESS_PERCENT,
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
                    { model: User, as: 'Faculty', attributes: ['id', 'name', 'email'] },
                ],
            }],
            order: [['createdAt', 'DESC']],
        });

        const batchIds = enrollments.map((enrollment: any) => enrollment.batchId);

        const liveClassReady = await isLiveClassTableReady();
        const [progressByBatchId, attendanceRecords, announcements, testResults, notifications, paymentSummary, upcomingLiveClasses, upcomingLiveClassCount, certificates, certificateCount] = await Promise.all([
            buildBatchProgressMap(studentId, batchIds),
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
                attributes: TEST_RESULT_BASE_ATTRIBUTES as unknown as string[],
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
                    { model: User, as: 'Faculty', attributes: ['id', 'name', 'email'] },
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
        const mappedEnrollments = enrollments.map((enrollment: any) => mapEnrollment(enrollment, progressByBatchId));

        const attendancePercentage = attendanceRecords.length
            ? Math.round((attendanceRecords.filter((record: any) => record.status === 'PRESENT').length / attendanceRecords.length) * 100)
            : 0;

        const averageTestScore = testResults.length
            ? Math.round(testResults.reduce((sum: number, result: any) => {
                if (Number.isFinite(Number(result.percentage))) {
                    return sum + Number(result.percentage);
                }
                const totalMarks = Number(result.test?.totalMarks || 0);
                return sum + calculatePercentage(Number(result.score || 0), totalMarks);
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
    } catch (error: any) {
        console.error('Fetch student dashboard error:', error);
        res.status(500).json({
            message: 'Error fetching dashboard',
            detail: process.env.NODE_ENV !== 'production' ? (error?.message || String(error)) : undefined,
        });
    }
};

export const getStudentPlacements = async (req: any, res: Response) => {
    try {
        const placements = await Placement.findAll({
            order: [['createdAt', 'DESC']],
        });

        res.json(placements);
    } catch (error) {
        console.error('Fetch student placements error:', error);
        res.status(500).json({ message: 'Error fetching placements' });
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
                { model: User, as: 'Faculty', attributes: ['id', 'name', 'email'] },
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
                { model: User, as: 'Faculty', attributes: ['id', 'name', 'email'] },
            ] }],
            order: [['createdAt', 'DESC']],
        });

        const batchIds = enrollments.map((enrollment: any) => enrollment.batchId);
        const progressByBatchId = await buildBatchProgressMap(studentId, batchIds);

        res.json(enrollments.map((enrollment: any) => mapEnrollment(enrollment, progressByBatchId)));
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
        const batchContentAttributes = await getBatchContentReadableAttributes();

        if (batchId) {
            const enrollment = await Enrollment.findOne({ where: { studentId, batchId } });
            if (!enrollment) return res.status(403).json({ message: 'Access denied: Enroll in this batch first' });

            const contentsWhere: any = { batchId };
            if (requestedType) contentsWhere.type = requestedType;

            const [contents, tests] = await Promise.all([
                BatchContent.findAll({
                    where: contentsWhere,
                    attributes: batchContentAttributes as unknown as string[],
                    include: [{
                        model: Batch,
                        as: 'batch',
                        attributes: ['id', 'name'],
                        include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }],
                    }],
                    order: [['createdAt', 'DESC']],
                }),
                Test.findAll({ where: { batchId }, order: [['createdAt', 'DESC']] }),
            ]);

            const normalizedContents = contents.map((content: any) => {
                const payload = typeof content.toJSON === 'function' ? content.toJSON() : content;
                return {
                    ...payload,
                    subject: payload.batch?.course?.title || payload.batch?.name || 'Course',
                    fileType: payload.type === 'RESOURCE' ? getStudyMaterialType(payload.contentUrl) || 'RESOURCE' : payload.type,
                    fileUrl: payload.contentUrl,
                    uploadedAt: payload.createdAt,
                };
            });

            return res.json({
                success: true,
                data: normalizedContents,
                contents: normalizedContents,
                tests,
            });
        }

        const enrollments = await Enrollment.findAll({ where: { studentId }, attributes: ['batchId'] });
        const batchIds = enrollments.map((enrollment: any) => enrollment.batchId);
        if (!batchIds.length) return res.json({ success: true, data: [] });

        const contentWhere: any = { batchId: { [Op.in]: batchIds } };
        if (requestedType) contentWhere.type = requestedType;

        const resources = await BatchContent.findAll({
            where: contentWhere,
            attributes: batchContentAttributes as unknown as string[],
            include: [{ model: Batch, as: 'batch', attributes: ['id', 'name'], include: [{ model: Course, as: 'course', attributes: ['title'] }] }],
            order: [['createdAt', 'DESC']],
        });

        res.json({
            success: true,
            data: resources.map((resource: any) => ({
                id: resource.id,
                title: resource.title,
                description: resource.description,
                subject: resource.batch?.course?.title || resource.batch?.name,
                fileType: resource.type === 'RESOURCE' ? getStudyMaterialType(resource.contentUrl) || 'RESOURCE' : resource.type,
                fileUrl: resource.contentUrl,
                contentUrl: resource.contentUrl,
                uploadedAt: resource.createdAt,
                createdAt: resource.createdAt,
                batchId: resource.batchId,
            })),
        });
    } catch (error) {
        console.error('Fetch resources error:', error);
        res.status(500).json({ message: 'Error fetching batch materials' });
    }
};

const ensureAssignmentSubmissionDir = () => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'assignment-submissions');
    fs.mkdirSync(uploadDir, { recursive: true });
    return uploadDir;
};

const sanitizeAssignmentFileName = (fileName: string) => fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

const saveAssignmentSubmissionFile = ({ fileName, fileData }: { fileName: string; fileData: string }) => {
    if (!fileName || !fileData) {
        throw new Error('Assignment file payload is incomplete');
    }

    const uploadDir = ensureAssignmentSubmissionDir();
    const safeName = sanitizeAssignmentFileName(fileName);
    const extension = path.extname(safeName);
    const baseName = path.basename(safeName, extension);
    const finalFileName = baseName + '-' + Date.now() + extension;
    const targetPath = path.join(uploadDir, finalFileName);

    const matches = fileData.match(/^data:(.+);base64,(.+)$/);
    const base64Payload = matches ? matches[2] : fileData;
    fs.writeFileSync(targetPath, Buffer.from(base64Payload, 'base64'));

    return {
        fileUrl: '/uploads/assignment-submissions/' + finalFileName,
        fileName: safeName,
    };
};

export const getStudentAssignments = async (req: any, res: Response) => {
    try {
        const studentId = req.user.id;
        const batchContentAttributes = await getBatchContentReadableAttributes();
        const assignmentSubmissionAttributes = await getAssignmentSubmissionReadableAttributes();
        const enrollments = await Enrollment.findAll({ where: { studentId }, attributes: ['batchId'] });
        const batchIds = enrollments.map((enrollment: any) => enrollment.batchId);

        if (!batchIds.length) {
            return res.json([]);
        }

        const assignments = await BatchContent.findAll({
            where: {
                batchId: { [Op.in]: batchIds },
                type: 'ASSIGNMENT',
            },
            attributes: batchContentAttributes as unknown as string[],
            include: [{
                model: Batch,
                as: 'batch',
                attributes: ['id', 'name'],
                include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }],
            }],
            order: [['createdAt', 'DESC']],
        });

        const assignmentIds = assignments.map((assignment: any) => assignment.id);
        const submissions = assignmentIds.length
            ? await AssignmentSubmission.findAll({
                where: {
                    studentId,
                    assignmentId: { [Op.in]: assignmentIds },
                },
                attributes: assignmentSubmissionAttributes as unknown as string[],
                order: [['submittedAt', 'DESC']],
            })
            : [];

        const submissionByAssignmentId = new Map<string, any>();
        submissions.forEach((submission: any) => {
            if (!submissionByAssignmentId.has(submission.assignmentId)) {
                submissionByAssignmentId.set(submission.assignmentId, submission);
            }
        });

        res.json(assignments.map((assignment: any) => {
            const submission = submissionByAssignmentId.get(assignment.id);
            return {
                id: assignment.id,
                title: assignment.title,
                description: assignment.description,
                batchId: assignment.batchId,
                batchName: assignment.batch?.name || 'Batch',
                courseName: assignment.batch?.course?.title || assignment.batch?.name || 'Course',
                maxMarks: resolveAssignmentMaxMarks(assignment.maxMarks),
                assignmentFileUrl: assignment.contentUrl,
                uploadedAt: assignment.createdAt,
                submission: submission ? {
                    id: submission.id,
                    fileUrl: submission.fileUrl,
                    fileName: submission.fileName,
                    notes: submission.notes,
                    status: submission.status,
                    grade: submission.grade,
                    feedback: submission.feedback,
                    submittedAt: submission.submittedAt,
                } : null,
            };
        }));
    } catch (error) {
        console.error('Fetch student assignments error:', error);
        res.status(500).json({ message: 'Error fetching assignments' });
    }
};

export const submitAssignment = async (req: any, res: Response) => {
    try {
        const studentId = req.user.id;
        const { assignmentId } = req.params;
        const { fileData, fileName, notes } = req.body;
        const batchContentAttributes = await getBatchContentReadableAttributes();
        const assignmentSubmissionAttributes = await getAssignmentSubmissionReadableAttributes();

        if (!fileData || !fileName) {
            return res.status(400).json({ message: 'Assignment file is required' });
        }

        const assignment = await BatchContent.findOne({
            where: { id: assignmentId, type: 'ASSIGNMENT' },
            attributes: batchContentAttributes as unknown as string[],
            include: [{ model: Batch, as: 'batch', attributes: ['id', 'name', 'FacultyId'], include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }] }],
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        const enrollment = await Enrollment.findOne({ where: { studentId, batchId: (assignment as any).batchId } });
        if (!enrollment) {
            return res.status(403).json({ message: 'You are not enrolled in this batch' });
        }

        const existingSubmission = await AssignmentSubmission.findOne({
            where: { studentId, assignmentId },
            attributes: assignmentSubmissionAttributes as unknown as string[],
        });
        if (existingSubmission) {
            return res.status(409).json({ message: 'Assignment already submitted' });
        }

        const savedFile = saveAssignmentSubmissionFile({ fileName, fileData });
        const submission = await AssignmentSubmission.create({
            studentId,
            assignmentId,
            batchId: (assignment as any).batchId,
            fileUrl: savedFile.fileUrl,
            fileName: savedFile.fileName,
            notes: typeof notes === 'string' ? notes.trim() : undefined,
            status: 'SUBMITTED',
            submittedAt: new Date(),
        });

        const batch = (assignment as any).batch;
        const FacultyId = batch?.FacultyId;
        if (FacultyId) {
            const notification = await Notification.create({
                title: 'Assignment Submitted: ' + assignment.title,
                message: [
                    'Student has submitted: ' + assignment.title,
                    'Course: ' + (batch?.course?.title || 'Course'),
                    'Batch: ' + (batch?.name || 'Batch'),
                    'File: ' + savedFile.fileName,
                ].join('\\n'),
                type: 'NOTIFICATION',
                audienceType: 'SELECTED_Faculty',
                sendEmail: false,
                createdBy: studentId,
                batchId: batch?.id || null,
                courseId: batch?.course?.id || null,
            });

            await NotificationRecipient.create({
                notificationId: notification.id,
                userId: FacultyId,
                emailSent: false,
            });
        }

        res.status(201).json({
            id: submission.id,
            fileUrl: submission.fileUrl,
            fileName: submission.fileName,
            notes: submission.notes,
            status: submission.status,
            grade: submission.grade,
            feedback: submission.feedback,
            submittedAt: submission.submittedAt,
        });
    } catch (error: any) {
        console.error('Submit assignment error:', error);
        res.status(500).json({ message: error.message || 'Error submitting assignment' });
    }
};

export const getMyTests = async (req: any, res: Response) => {
    try {
        const studentId = req.user.id;
        const enrollments = await Enrollment.findAll({ where: { studentId }, attributes: ['batchId'] });
        const batchIds = enrollments.map((enrollment: any) => enrollment.batchId);

        if (!batchIds.length) {
            return res.json([]);
        }

        const tests = await Test.findAll({
            where: { batchId: { [Op.in]: batchIds } },
            include: [{
                model: Batch,
                as: 'batch',
                attributes: ['id', 'name'],
                include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }],
            }],
            order: [['createdAt', 'DESC']],
        });

        const attempts = await TestResult.findAll({
            where: { studentId, testId: { [Op.in]: tests.map((test: any) => test.id) } },
            attributes: TEST_RESULT_BASE_ATTRIBUTES as unknown as string[],
            order: [['submittedAt', 'DESC']],
        });

        const latestAttemptByTestId = new Map<string, any>();
        attempts.forEach((attempt: any) => {
            if (!latestAttemptByTestId.has(attempt.testId)) {
                latestAttemptByTestId.set(attempt.testId, attempt);
            }
        });

        res.json(tests.map((test: any) => ({
            id: test.id,
            title: test.title,
            description: test.description,
            totalMarks: test.totalMarks,
            durationMinutes: test.durationMinutes,
            dueAt: test.dueAt || null,
            questions: Array.isArray(test.questions) ? test.questions : [],
            batchId: test.batchId,
            batchName: test.batch?.name || 'Batch',
            courseId: test.batch?.course?.id || null,
            courseName: test.batch?.course?.title || test.batch?.name || 'Course',
            attempt: latestAttemptByTestId.has(test.id)
                ? {
                    id: latestAttemptByTestId.get(test.id).id,
                    score: latestAttemptByTestId.get(test.id).score,
                    percentage: Number.isFinite(Number(latestAttemptByTestId.get(test.id).percentage))
                        ? Number(latestAttemptByTestId.get(test.id).percentage)
                        : calculatePercentage(Number(latestAttemptByTestId.get(test.id).score || 0), Number(test.totalMarks || 0)),
                    correctAnswers: Number.isFinite(Number(latestAttemptByTestId.get(test.id).correctAnswers))
                        ? Number(latestAttemptByTestId.get(test.id).correctAnswers)
                        : null,
                    wrongAnswers: Number.isFinite(Number(latestAttemptByTestId.get(test.id).wrongAnswers))
                        ? Number(latestAttemptByTestId.get(test.id).wrongAnswers)
                        : null,
                    unansweredQuestions: Number.isFinite(Number(latestAttemptByTestId.get(test.id).unansweredQuestions))
                        ? Number(latestAttemptByTestId.get(test.id).unansweredQuestions)
                        : null,
                    autoSubmitted: Boolean(latestAttemptByTestId.get(test.id).autoSubmitted),
                    violationReason: latestAttemptByTestId.get(test.id).violationReason || null,
                    completionTime: latestAttemptByTestId.get(test.id).completionTime,
                    submittedAt: latestAttemptByTestId.get(test.id).submittedAt,
                }
                : null,
        })));
    } catch (error) {
        console.error('Fetch my tests error:', error);
        res.status(500).json({ message: 'Error fetching tests' });
    }
};

export const submitExamResult = async (req: any, res: Response) => {
    try {
        const studentId = req.user.id;
        const { testId, answers, completionTime, forceSubmit, violationReason } = req.body;
        const isForceSubmit = Boolean(forceSubmit);
        const normalizedViolationReason = asTrimmedViolationReason(violationReason);

        if (!testId) {
            return res.status(400).json({ message: 'testId is required' });
        }

        if (isForceSubmit && !ALLOWED_FORCE_SUBMIT_REASONS.has(normalizedViolationReason)) {
            return res.status(400).json({
                message: 'force submit reason must be TIME_EXPIRED, TAB_SWITCH, or WINDOW_BLUR',
            });
        }

        const test = await Test.findByPk(testId, {
            include: [{ model: Batch, as: 'batch', attributes: ['id', 'name'], include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }] }],
        });

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        const enrollment = await Enrollment.findOne({ where: { studentId, batchId: (test as any).batchId } });
        if (!enrollment) {
            return res.status(403).json({ message: 'You are not enrolled in this batch' });
        }

        const existingResult = await TestResult.findOne({
            where: { studentId, testId },
            attributes: ['id'],
        });
        if (existingResult) {
            return res.status(409).json({ message: 'This test has already been submitted' });
        }

        const questions = Array.isArray((test as any).questions) ? (test as any).questions : [];
        if (!questions.length) {
            return res.status(400).json({ message: 'This test has no questions configured' });
        }

        const dueAtValue = (test as any).dueAt ? new Date((test as any).dueAt) : null;
        const isDueDateValid = dueAtValue instanceof Date && !Number.isNaN(dueAtValue.getTime());
        const dueDateExpired = isDueDateValid && dueAtValue.getTime() <= Date.now();

        if (dueDateExpired && !(isForceSubmit && normalizedViolationReason === 'TIME_EXPIRED')) {
            return res.status(410).json({ message: 'The due time for this test has passed' });
        }

        const normalizedAnswers = answers && typeof answers === 'object' ? answers : {};
        const answeredCount = questions.filter((question: any) => Object.prototype.hasOwnProperty.call(normalizedAnswers, question.id)).length;

        if (!isForceSubmit && answeredCount !== questions.length) {
            return res.status(400).json({ message: 'All questions are required before submission' });
        }

        const correctAnswers = questions.reduce((sum: number, question: any) => {
            return sum + (Number(normalizedAnswers[question.id]) === Number(question.correctIndex) ? 1 : 0);
        }, 0);

        const totalQuestions = questions.length;
        const totalMarks = Number((test as any).totalMarks || totalQuestions || 0);
        const score = totalQuestions ? Math.round((correctAnswers / totalQuestions) * totalMarks) : 0;
        const unansweredQuestions = Math.max(totalQuestions - answeredCount, 0);
        const wrongAnswers = Math.max(answeredCount - correctAnswers, 0);
        const percentage = calculatePercentage(score, totalMarks);
        const normalizedCompletionTime = Number(completionTime || 0);
        const result = await TestResult.create({
            studentId,
            testId,
            score,
            correctAnswers,
            wrongAnswers,
            unansweredQuestions,
            percentage,
            autoSubmitted: isForceSubmit,
            violationReason: isForceSubmit ? normalizedViolationReason : null,
            completionTime: Number.isFinite(normalizedCompletionTime) ? normalizedCompletionTime : 0,
            submittedAt: new Date(),
        });

        res.status(201).json({
            result,
            summary: {
                score,
                totalMarks,
                correctAnswers,
                totalQuestions,
                wrongAnswers,
                unansweredQuestions,
                percentage,
                autoSubmitted: isForceSubmit,
                violationReason: isForceSubmit ? normalizedViolationReason : null,
            },
        });
    } catch (error: any) {
        if (error?.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'This test has already been submitted' });
        }
        console.error('Submit exam error:', error);
        res.status(500).json({ message: error.message || 'Error submitting test' });
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
