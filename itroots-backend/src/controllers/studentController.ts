import { Response } from 'express';
import fs from 'fs';
import path from 'path';
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
import AssignmentSubmission from '../models/AssignmentSubmission';
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
                    { model: User, as: 'Faculty', attributes: ['id', 'name', 'email'] },
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

        if (!fileData || !fileName) {
            return res.status(400).json({ message: 'Assignment file is required' });
        }

        const assignment = await BatchContent.findOne({
            where: { id: assignmentId, type: 'ASSIGNMENT' },
            include: [{ model: Batch, as: 'batch', attributes: ['id', 'name', 'FacultyId'], include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }] }],
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        const enrollment = await Enrollment.findOne({ where: { studentId, batchId: (assignment as any).batchId } });
        if (!enrollment) {
            return res.status(403).json({ message: 'You are not enrolled in this batch' });
        }

        const existingSubmission = await AssignmentSubmission.findOne({ where: { studentId, assignmentId } });
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
            questions: Array.isArray(test.questions) ? test.questions : [],
            batchId: test.batchId,
            batchName: test.batch?.name || 'Batch',
            courseId: test.batch?.course?.id || null,
            courseName: test.batch?.course?.title || test.batch?.name || 'Course',
            attempt: latestAttemptByTestId.has(test.id)
                ? {
                    id: latestAttemptByTestId.get(test.id).id,
                    score: latestAttemptByTestId.get(test.id).score,
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

        if (!testId) {
            return res.status(400).json({ message: 'testId is required' });
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

        const existingResult = await TestResult.findOne({ where: { studentId, testId } });
        if (existingResult) {
            return res.status(409).json({ message: 'This test has already been submitted' });
        }

        const questions = Array.isArray((test as any).questions) ? (test as any).questions : [];
        if (!questions.length) {
            return res.status(400).json({ message: 'This test has no questions configured' });
        }

        const normalizedAnswers = answers && typeof answers === 'object' ? answers : {};
        const answeredCount = questions.filter((question: any) => Object.prototype.hasOwnProperty.call(normalizedAnswers, question.id)).length;

        if (!forceSubmit && answeredCount !== questions.length) {
            return res.status(400).json({ message: 'All questions are required before submission' });
        }

        const correctAnswers = questions.reduce((sum: number, question: any) => {
            return sum + (Number(normalizedAnswers[question.id]) === Number(question.correctIndex) ? 1 : 0);
        }, 0);

        const totalQuestions = questions.length;
        const totalMarks = Number((test as any).totalMarks || totalQuestions || 0);
        const score = totalQuestions ? Math.round((correctAnswers / totalQuestions) * totalMarks) : 0;
        const normalizedCompletionTime = Number(completionTime || 0);
        const result = await TestResult.create({
            studentId,
            testId,
            score,
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
                wrongAnswers: totalQuestions - correctAnswers,
                unansweredQuestions: totalQuestions - answeredCount,
                percentage: totalMarks ? Math.round((score / totalMarks) * 100) : 0,
                autoSubmitted: Boolean(forceSubmit),
                violationReason: forceSubmit ? (violationReason || 'AUTO_SUBMIT') : null,
            },
        });
    } catch (error: any) {
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

