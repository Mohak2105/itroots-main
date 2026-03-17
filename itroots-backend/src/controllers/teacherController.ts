import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';
import Batch from '../models/Batch';
import BatchContent, { ensureBatchContentOptionalColumns, getBatchContentReadableAttributes } from '../models/BatchContent';
import Test from '../models/Test';
import TestResult, { TEST_RESULT_BASE_ATTRIBUTES } from '../models/TestResult';
import User from '../models/User';
import Enrollment from '../models/Enrollment';
import Course from '../models/Course';
import NotificationRecipient from '../models/NotificationRecipient';
import Notification from '../models/Notification';
import LiveClass from '../models/LiveClass';
import AssignmentSubmission, { getAssignmentSubmissionReadableAttributes } from '../models/AssignmentSubmission';
import { isLiveClassTableReady } from '../utils/liveClassSchema';
import { getNotificationWriteErrorMessage } from '../utils/notificationErrors';
import { getStudyMaterialType, STUDY_MATERIAL_FILE_HELPER_TEXT } from '../utils/studyMaterial';

const MCQ_OPTION_COUNT = 4;
const MCQ_MIN_QUESTIONS = 1;
const MCQ_MAX_QUESTIONS = 50;
const CORRECT_OPTION_INDEX: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

class McqValidationError extends Error {
    rowErrors: string[];

    constructor(rowErrors: string[]) {
        super(rowErrors[0] || 'Invalid MCQ payload');
        this.name = 'McqValidationError';
        this.rowErrors = rowErrors;
    }
}

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

const asTrimmedString = (value: any) => String(value ?? '').trim();

const parsePositiveInteger = (value: any) => {
    const normalized = asTrimmedString(value);
    if (!normalized) return null;
    const parsed = Number(normalized);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return Number.NaN;
    }
    return parsed;
};

const parseOptionalDateTime = (value: any) => {
    const normalized = asTrimmedString(value);
    if (!normalized) return null;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return Number.NaN;
    return date;
};

const formatDateTimeLabel = (value?: Date | string | null) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

const resolveAssignmentMaxMarks = (value: any, fallback = 100) => {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) {
        return parsed;
    }
    return fallback;
};

const resolveQuestionText = (question: any) =>
    asTrimmedString(question?.text ?? question?.question ?? question?.questionText);

const resolveQuestionOptions = (question: any) => {
    if (Array.isArray(question?.options)) {
        return question.options.slice(0, MCQ_OPTION_COUNT).map((option: any) => asTrimmedString(option));
    }

    if (question?.options && typeof question.options === 'object') {
        return ['A', 'B', 'C', 'D'].map((key, index) => asTrimmedString(
            question.options[key]
            ?? question.options[key.toLowerCase()]
            ?? question.options[index]
        ));
    }

    return [
        asTrimmedString(question?.option_a ?? question?.optionA ?? question?.A),
        asTrimmedString(question?.option_b ?? question?.optionB ?? question?.B),
        asTrimmedString(question?.option_c ?? question?.optionC ?? question?.C),
        asTrimmedString(question?.option_d ?? question?.optionD ?? question?.D),
    ];
};

const resolveCorrectIndex = (question: any) => {
    const numericCandidate = Number(
        question?.correctIndex
        ?? question?.correct_option_index
        ?? question?.correctOptionIndex
    );
    if (Number.isInteger(numericCandidate) && numericCandidate >= 0 && numericCandidate < MCQ_OPTION_COUNT) {
        return numericCandidate;
    }

    const labelCandidate = asTrimmedString(
        question?.correctOption
        ?? question?.correct_option
        ?? question?.answer
        ?? question?.correctAnswer
    ).toUpperCase();

    if (labelCandidate in CORRECT_OPTION_INDEX) {
        return CORRECT_OPTION_INDEX[labelCandidate];
    }

    if (['1', '2', '3', '4'].includes(labelCandidate)) {
        return Number(labelCandidate) - 1;
    }

    return Number.NaN;
};

const normalizeMcqQuestions = (questions: any) => {
    if (!Array.isArray(questions)) {
        throw new McqValidationError(['Questions must be provided as an array']);
    }

    if (questions.length < MCQ_MIN_QUESTIONS) {
        throw new McqValidationError([`At least ${MCQ_MIN_QUESTIONS} MCQ question is required`]);
    }

    if (questions.length > MCQ_MAX_QUESTIONS) {
        throw new McqValidationError([`Maximum ${MCQ_MAX_QUESTIONS} questions are allowed per test`]);
    }

    const rowErrors: string[] = [];

    const normalized = questions.map((question: any, index: number) => {
        const text = resolveQuestionText(question);
        const options = resolveQuestionOptions(question);
        const correctIndex = resolveCorrectIndex(question);

        if (!text) {
            rowErrors.push(`Question ${index + 1}: text is required`);
        }

        if (options.length !== MCQ_OPTION_COUNT || options.some((option: string) => !option)) {
            rowErrors.push(`Question ${index + 1}: exactly ${MCQ_OPTION_COUNT} non-empty options are required`);
        }

        if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= MCQ_OPTION_COUNT) {
            rowErrors.push(`Question ${index + 1}: correct option must be A, B, C, or D`);
        }

        return {
            id: `q-${index + 1}`,
            text,
            options,
            correctIndex,
        };
    });

    if (rowErrors.length) {
        throw new McqValidationError(rowErrors);
    }

    return normalized;
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
        const batchContentAttributes = await getBatchContentReadableAttributes();

        const batch = await Batch.findOne({
            where: { id: batchId, FacultyId },
            include: [
                { model: Course, as: 'course', attributes: ['id', 'title', 'slug'] },
                { model: User, as: 'Faculty', attributes: ['id', 'name', 'email'] },
            ],
        });

        if (!batch) return res.status(404).json({ message: 'Batch not found' });

        const [contents, tests, enrollments] = await Promise.all([
            BatchContent.findAll({
                where: { batchId },
                attributes: batchContentAttributes as unknown as string[],
                order: [['createdAt', 'DESC']],
            }),
            Test.findAll({ where: { batchId }, order: [['createdAt', 'DESC']] }),
            Enrollment.findAll({
                where: { batchId },
                include: [{ model: User, as: 'student', attributes: ['id', 'username', 'name', 'email'] }],
                order: [['createdAt', 'DESC']],
            }),
        ]);

        const normalizedContents = contents.map((content: any) => {
            const payload = typeof content.toJSON === 'function' ? content.toJSON() : content;
            return {
                ...payload,
                fileType: payload.type === 'RESOURCE' ? getStudyMaterialType(payload.contentUrl) || 'RESOURCE' : payload.type,
            };
        });

        res.json({ success: true, data: { batch, contents: normalizedContents, tests, enrollments } });
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

export const getFacultySentNotifications = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;

        const notifications = await Notification.findAll({
            where: {
                createdBy: FacultyId,
                audienceType: 'SELECTED_BATCH_STUDENTS',
            },
            include: [
                { model: Batch, as: 'batch', attributes: ['id', 'name'] },
                { model: Course, as: 'course', attributes: ['id', 'title'] },
                {
                    model: NotificationRecipient,
                    as: 'recipients',
                    attributes: ['id', 'userId', 'readAt', 'createdAt'],
                    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json(notifications);
    } catch (error: any) {
        console.error('Get faculty sent notifications error:', error);
        res.status(500).json({ message: error.message || 'Unable to fetch sent notifications' });
    }
};

export const createFacultyNotification = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;
        const title = asTrimmedString(req.body.title);
        const message = asTrimmedString(req.body.message);
        const batchId = asTrimmedString(req.body.batchId);
        const requestedType = asTrimmedString(req.body.type).toUpperCase() || 'ANNOUNCEMENT';
        const allowedTypes = new Set(['ANNOUNCEMENT', 'NOTIFICATION', 'REMINDER', 'ALERT']);

        if (!title || !message || !batchId) {
            return res.status(400).json({ message: 'title, message, and batchId are required' });
        }

        if (!allowedTypes.has(requestedType)) {
            return res.status(400).json({ message: 'type must be ANNOUNCEMENT, NOTIFICATION, REMINDER, or ALERT' });
        }

        const batch = await Batch.findOne({
            where: { id: batchId, FacultyId },
            include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }],
        });

        if (!batch) {
            return res.status(404).json({ message: 'Batch not found or not assigned to this teacher' });
        }

        const enrollments = await Enrollment.findAll({
            where: {
                batchId,
                status: 'ACTIVE',
            },
            include: [{
                model: User,
                as: 'student',
                attributes: ['id', 'name', 'email', 'isActive'],
                where: { isActive: true },
            }],
        });

        const recipientUserIds = Array.from(new Set(
            enrollments
                .map((enrollment: any) => enrollment.student?.id)
                .filter(Boolean)
        ));

        if (!recipientUserIds.length) {
            return res.status(400).json({ message: 'No active students are enrolled in this batch' });
        }

        const notification = await Notification.create({
            title,
            message,
            type: requestedType as any,
            audienceType: 'SELECTED_BATCH_STUDENTS',
            sendEmail: false,
            createdBy: FacultyId,
            batchId: batch.id,
            courseId: (batch as any).course?.id || batch.courseId,
        });

        await NotificationRecipient.bulkCreate(
            recipientUserIds.map((userId: string) => ({
                notificationId: notification.id,
                userId,
                emailSent: false,
            })),
            { ignoreDuplicates: true }
        );

        const createdNotification = await Notification.findByPk(notification.id, {
            include: [
                { model: Batch, as: 'batch', attributes: ['id', 'name'] },
                { model: Course, as: 'course', attributes: ['id', 'title'] },
                {
                    model: NotificationRecipient,
                    as: 'recipients',
                    attributes: ['id', 'userId', 'readAt', 'createdAt'],
                    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
                },
            ],
        });

        res.status(201).json({
            message: 'Notification sent successfully',
            recipientCount: recipientUserIds.length,
            notification: createdNotification,
        });
    } catch (error: any) {
        console.error('Create faculty notification error:', error);
        res.status(500).json({ message: getNotificationWriteErrorMessage(error) });
    }
};

export const addBatchContent = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;
        const { batchId, title, description, contentUrl, fileData, fileName, codingLanguage, starterCode, codingInstructions } = req.body;
        const type = typeof req.body.type === 'string' ? req.body.type.toUpperCase() : req.body.type;
        const requestedMaterialFormat = typeof req.body.materialFormat === 'string'
            ? req.body.materialFormat.toUpperCase()
            : '';
        const parsedMaxMarks = parsePositiveInteger(req.body.maxMarks);

        const batch = await Batch.findOne({
            where: { id: batchId, FacultyId },
            include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }],
        });

        if (!batch) {
            return res.status(404).json({ message: 'Batch not found for this Faculty' });
        }

        const availableBatchContentColumns = (
            type === 'ASSIGNMENT' || type === 'CODING'
                ? await ensureBatchContentOptionalColumns()
                : await getBatchContentReadableAttributes().then((attributes) => new Set(attributes))
        );
        let resolvedContentUrl = String(contentUrl || '').trim();
        let validatedAssignmentMaxMarks: number | undefined;

        if (type === 'CODING') {
            const validLanguages = ['python', 'java', 'csharp'];
            if (!codingLanguage || !validLanguages.includes(codingLanguage)) {
                return res.status(400).json({ message: 'Valid coding language is required (python, java, csharp)' });
            }
            resolvedContentUrl = '';
        } else {
            if (type === 'ASSIGNMENT' && (parsedMaxMarks === null || !Number.isInteger(parsedMaxMarks) || parsedMaxMarks <= 0)) {
                return res.status(400).json({ message: 'maxMarks is required for assignments and must be a positive whole number' });
            }

            validatedAssignmentMaxMarks = type === 'ASSIGNMENT' ? parsedMaxMarks as number : undefined;

            if (type === 'RESOURCE') {
                const detectedMaterialFormat = getStudyMaterialType(fileName || resolvedContentUrl);
                if (!detectedMaterialFormat) {
                    return res.status(400).json({ message: STUDY_MATERIAL_FILE_HELPER_TEXT });
                }

                if (requestedMaterialFormat && requestedMaterialFormat !== detectedMaterialFormat) {
                    return res.status(400).json({
                        message: `Selected material type does not match the uploaded file. Detected: ${detectedMaterialFormat}.`,
                    });
                }
            }

            if (type !== 'VIDEO' && fileData && fileName) {
                resolvedContentUrl = saveBatchContentFile({ fileName, fileData });
            }
            if (!resolvedContentUrl) {
                return res.status(400).json({ message: type === 'VIDEO' ? 'Video URL is required' : 'Assignment or resource file/URL is required' });
            }
        }

        const contentPayload: Record<string, unknown> = {
            batchId, title, description, type,
            contentUrl: resolvedContentUrl || undefined,
        };

        if (availableBatchContentColumns.has('maxMarks') && type === 'ASSIGNMENT') {
            contentPayload.maxMarks = validatedAssignmentMaxMarks;
        }

        if (type === 'CODING') {
            if (availableBatchContentColumns.has('codingLanguage')) {
                contentPayload.codingLanguage = codingLanguage;
            }
            if (availableBatchContentColumns.has('starterCode')) {
                contentPayload.starterCode = starterCode;
            }
            if (availableBatchContentColumns.has('codingInstructions')) {
                contentPayload.codingInstructions = codingInstructions;
            }
        }

        const content = await BatchContent.create(contentPayload as any);

        const courseTitle = (batch as any).course?.title || 'Course';
        const batchName = (batch as any).name || 'Batch';
        const notificationTitle = type === 'VIDEO'
            ? `New Video Class: ${title}`
            : type === 'CODING'
                ? `New Coding Assignment: ${title}`
                : type === 'ASSIGNMENT'
                    ? `New Assignment: ${title}`
                    : `New Study Material: ${title}`;
        const notificationMessage = [
            `${title}`,
            `Course: ${courseTitle}`,
            `Batch: ${batchName}`,
            type === 'VIDEO' ? `Watch here: ${resolvedContentUrl}` : type === 'CODING' ? `Language: ${codingLanguage}` : `Open here: ${resolvedContentUrl}`,
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

export const deleteBatchContent = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;
        const { contentId } = req.params;
        const batchContentAttributes = await getBatchContentReadableAttributes();

        const content = await BatchContent.findOne({
            where: { id: contentId },
            attributes: batchContentAttributes as unknown as string[],
        });

        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        const batch = await Batch.findOne({
            where: { id: content.batchId, FacultyId },
            attributes: ['id'],
        });

        if (!batch) {
            return res.status(404).json({ message: 'Content not found for this Faculty' });
        }

        if (content.type === 'ASSIGNMENT') {
            const submissionCount = await AssignmentSubmission.count({ where: { assignmentId: content.id } });
            if (submissionCount > 0) {
                return res.status(409).json({ message: 'Assignments with student submissions cannot be deleted' });
            }
        }

        const rawUrl = String(content.contentUrl || '').trim();
        if (rawUrl.startsWith('/uploads/batch-content/')) {
            const relativePath = rawUrl.replace(/^\/+/, '').split('/').join(path.sep);
            const targetPath = path.join(__dirname, '..', '..', relativePath);
            if (fs.existsSync(targetPath)) {
                fs.unlinkSync(targetPath);
            }
        }

        await content.destroy();

        return res.json({ success: true, message: 'Content deleted successfully' });
    } catch (error: any) {
        console.error('Delete batch content error:', error);
        return res.status(500).json({ message: error.message || 'Unable to delete content' });
    }
};

export const updateBatchContent = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;
        const { contentId } = req.params;
        const initialBatchContentAttributes = await getBatchContentReadableAttributes();
        const existingContent = await BatchContent.findOne({
            where: { id: contentId },
            attributes: initialBatchContentAttributes as unknown as string[],
        });

        if (!existingContent) {
            return res.status(404).json({ message: 'Content not found' });
        }

        const availableBatchContentColumns = (
            existingContent.type === 'ASSIGNMENT' || existingContent.type === 'CODING'
                ? await ensureBatchContentOptionalColumns()
                : new Set(initialBatchContentAttributes)
        );

        const nextBatchId = asTrimmedString(req.body.batchId) || existingContent.batchId;
        const targetBatch = await Batch.findOne({
            where: { id: nextBatchId, FacultyId },
            include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }],
        });

        if (!targetBatch) {
            return res.status(404).json({ message: 'Batch not found for this Faculty' });
        }

        const nextTitle = asTrimmedString(req.body.title) || existingContent.title;
        const nextDescription = req.body.description === undefined
            ? existingContent.description || null
            : asTrimmedString(req.body.description) || null;
        const parsedMaxMarks = parsePositiveInteger(req.body.maxMarks);

        let resolvedContentUrl = asTrimmedString(req.body.contentUrl) || asTrimmedString(existingContent.contentUrl);
        const fileName = asTrimmedString(req.body.fileName);
        const fileData = typeof req.body.fileData === 'string' ? req.body.fileData : '';
        const hasReplacementFile = Boolean(fileName && fileData);

        if (existingContent.type === 'ASSIGNMENT') {
            const submissionCount = await AssignmentSubmission.count({ where: { assignmentId: existingContent.id } });
            const hasSubmissions = submissionCount > 0;

            if (hasSubmissions) {
                const isChangingBatch = nextBatchId !== existingContent.batchId;
                const isChangingFile = hasReplacementFile;
                const requestedContentUrl = asTrimmedString(req.body.contentUrl);
                const isChangingContentUrl = Boolean(requestedContentUrl && requestedContentUrl !== asTrimmedString(existingContent.contentUrl));
                const requestedMaxMarks = req.body.maxMarks !== undefined
                    ? parsedMaxMarks
                    : resolveAssignmentMaxMarks(existingContent.maxMarks);
                const isChangingMaxMarks = req.body.maxMarks !== undefined
                    && requestedMaxMarks !== resolveAssignmentMaxMarks(existingContent.maxMarks);

                if (isChangingBatch || isChangingFile || isChangingContentUrl || isChangingMaxMarks) {
                    return res.status(409).json({
                        message: 'Batch, file, and max marks cannot be changed after students have submitted this assignment',
                    });
                }
            }

            const nextAssignmentMaxMarks = req.body.maxMarks === undefined
                ? resolveAssignmentMaxMarks(existingContent.maxMarks)
                : parsedMaxMarks;

            if (nextAssignmentMaxMarks === null || !Number.isInteger(nextAssignmentMaxMarks) || nextAssignmentMaxMarks <= 0) {
                return res.status(400).json({ message: 'maxMarks is required for assignments and must be a positive whole number' });
            }

            const validatedNextAssignmentMaxMarks = nextAssignmentMaxMarks as number;

            const assignmentUpdatePayload: Record<string, unknown> = {
                batchId: nextBatchId,
                title: nextTitle,
                description: nextDescription || undefined,
                contentUrl: resolvedContentUrl || undefined,
            };

            if (availableBatchContentColumns.has('maxMarks')) {
                assignmentUpdatePayload.maxMarks = validatedNextAssignmentMaxMarks;
            }

            await existingContent.update(assignmentUpdatePayload);

            return res.json({ success: true, data: existingContent });
        }

        if (existingContent.type === 'VIDEO') {
            if (!resolvedContentUrl) {
                return res.status(400).json({ message: 'Video URL is required' });
            }
        } else {
            if (existingContent.type === 'RESOURCE' && (hasReplacementFile || req.body.contentUrl !== undefined)) {
                const requestedMaterialFormat = typeof req.body.materialFormat === 'string'
                    ? req.body.materialFormat.toUpperCase()
                    : '';
                const detectedMaterialFormat = getStudyMaterialType(fileName || asTrimmedString(req.body.contentUrl) || resolvedContentUrl);

                if (!detectedMaterialFormat) {
                    return res.status(400).json({ message: STUDY_MATERIAL_FILE_HELPER_TEXT });
                }

                if (requestedMaterialFormat && requestedMaterialFormat !== detectedMaterialFormat) {
                    return res.status(400).json({
                        message: `Selected material type does not match the uploaded file. Detected: ${detectedMaterialFormat}.`,
                    });
                }
            }

            if (fileName && fileData) {
                const nextFileUrl = saveBatchContentFile({ fileName, fileData });
                const previousUrl = asTrimmedString(existingContent.contentUrl);
                if (previousUrl.startsWith('/uploads/batch-content/')) {
                    const relativePath = previousUrl.replace(/^\/+/, '').split('/').join(path.sep);
                    const targetPath = path.join(__dirname, '..', '..', relativePath);
                    if (fs.existsSync(targetPath)) {
                        fs.unlinkSync(targetPath);
                    }
                }
                resolvedContentUrl = nextFileUrl;
            }
        }

        const genericUpdatePayload: Record<string, unknown> = {
            batchId: nextBatchId,
            title: nextTitle,
            description: nextDescription || undefined,
            contentUrl: resolvedContentUrl || undefined,
        };

        if (availableBatchContentColumns.has('maxMarks')) {
            genericUpdatePayload.maxMarks = null;
        }

        await existingContent.update(genericUpdatePayload);

        return res.json({ success: true, data: existingContent });
    } catch (error: any) {
        console.error('Update batch content error:', error);
        return res.status(500).json({ message: error.message || 'Unable to update content' });
    }
};

export const createTest = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;
        const { batchId, title, description, totalMarks, durationMinutes, questions, dueAt } = req.body;
        const normalizedTitle = asTrimmedString(title);
        const normalizedDescription = asTrimmedString(description) || null;

        if (!batchId || !normalizedTitle) {
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
        const normalizedDueAt = parseOptionalDateTime(dueAt);

        if (!Number.isFinite(normalizedTotalMarks) || normalizedTotalMarks <= 0) {
            return res.status(400).json({ message: 'totalMarks must be greater than zero' });
        }

        if (!Number.isFinite(normalizedDurationMinutes) || normalizedDurationMinutes <= 0) {
            return res.status(400).json({ message: 'durationMinutes must be greater than zero' });
        }

        if (typeof normalizedDueAt === 'number' && Number.isNaN(normalizedDueAt)) {
            return res.status(400).json({ message: 'dueAt must be a valid date-time' });
        }

        if (normalizedDueAt instanceof Date && normalizedDueAt.getTime() <= Date.now()) {
            return res.status(400).json({ message: 'dueAt must be in the future' });
        }

        const test = await Test.create({
            batchId,
            title: normalizedTitle,
            description: normalizedDescription || undefined,
            totalMarks: normalizedTotalMarks,
            durationMinutes: normalizedDurationMinutes,
            dueAt: normalizedDueAt instanceof Date ? normalizedDueAt : null,
            questions: normalizedQuestions,
        });

        const courseTitle = (batch as any).course?.title || 'Course';
        const batchName = (batch as any).name || 'Batch';
        const notificationMessage = [
            `${normalizedTitle}`,
            `Course: ${courseTitle}`,
            `Batch: ${batchName}`,
            `Questions: ${normalizedQuestions.length}`,
            `Duration: ${normalizedDurationMinutes} minutes`,
            `Total Marks: ${normalizedTotalMarks}`,
            normalizedDueAt instanceof Date ? `Due: ${formatDateTimeLabel(normalizedDueAt)}` : null,
            normalizedDescription ? `Details: ${normalizedDescription}` : null,
        ].filter(Boolean).join('\n');

        await createBatchStudentNotification({
            FacultyId,
            batch,
            title: `New Test Available: ${normalizedTitle}`,
            message: notificationMessage,
        });

        res.status(201).json(test);
    } catch (error: any) {
        if (error instanceof McqValidationError) {
            return res.status(400).json({
                message: 'Invalid MCQ payload',
                errors: error.rowErrors,
            });
        }
        console.error('Create test error:', error);
        res.status(500).json({ message: error.message || 'Error creating test' });
    }
};

export const updateTest = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;
        const { testId } = req.params;
        const { batchId, title, description, totalMarks, durationMinutes, questions, dueAt } = req.body;
        const normalizedTitle = asTrimmedString(title);
        const normalizedDescription = asTrimmedString(description) || null;

        if (!batchId || !normalizedTitle) {
            return res.status(400).json({ message: 'batchId and title are required' });
        }

        const test = await Test.findByPk(testId, {
            include: [{
                model: Batch,
                as: 'batch',
                attributes: ['id', 'FacultyId'],
            }],
        });

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        const ownedBatch = (test as any).batch;
        if (!ownedBatch || ownedBatch.FacultyId !== FacultyId) {
            return res.status(403).json({ message: 'You do not have access to this test' });
        }

        const attemptCount = await TestResult.count({ where: { testId } });
        if (attemptCount > 0) {
            return res.status(409).json({ message: 'Tests with student attempts cannot be edited' });
        }

        const targetBatch = await Batch.findOne({
            where: { id: batchId, FacultyId },
        });

        if (!targetBatch) {
            return res.status(404).json({ message: 'Batch not found for this Faculty' });
        }

        const normalizedQuestions = normalizeMcqQuestions(questions);
        const normalizedTotalMarks = Number(totalMarks || normalizedQuestions.length);
        const normalizedDurationMinutes = Number(durationMinutes || 60);
        const normalizedDueAt = parseOptionalDateTime(dueAt);

        if (!Number.isFinite(normalizedTotalMarks) || normalizedTotalMarks <= 0) {
            return res.status(400).json({ message: 'totalMarks must be greater than zero' });
        }

        if (!Number.isFinite(normalizedDurationMinutes) || normalizedDurationMinutes <= 0) {
            return res.status(400).json({ message: 'durationMinutes must be greater than zero' });
        }

        if (typeof normalizedDueAt === 'number' && Number.isNaN(normalizedDueAt)) {
            return res.status(400).json({ message: 'dueAt must be a valid date-time' });
        }

        if (normalizedDueAt instanceof Date && normalizedDueAt.getTime() <= Date.now()) {
            return res.status(400).json({ message: 'dueAt must be in the future' });
        }

        await test.update({
            batchId,
            title: normalizedTitle,
            description: normalizedDescription || undefined,
            totalMarks: normalizedTotalMarks,
            durationMinutes: normalizedDurationMinutes,
            dueAt: normalizedDueAt instanceof Date ? normalizedDueAt : null,
            questions: normalizedQuestions,
        });

        return res.json(test);
    } catch (error: any) {
        if (error instanceof McqValidationError) {
            return res.status(400).json({
                message: 'Invalid MCQ payload',
                errors: error.rowErrors,
            });
        }
        console.error('Update test error:', error);
        return res.status(500).json({ message: error.message || 'Error updating test' });
    }
};

export const deleteTest = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;
        const { testId } = req.params;

        const test = await Test.findByPk(testId, {
            include: [{
                model: Batch,
                as: 'batch',
                attributes: ['id', 'FacultyId'],
            }],
        });

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        const ownedBatch = (test as any).batch;
        if (!ownedBatch || ownedBatch.FacultyId !== FacultyId) {
            return res.status(403).json({ message: 'You do not have access to this test' });
        }

        const attemptCount = await TestResult.count({ where: { testId } });
        if (attemptCount > 0) {
            return res.status(409).json({ message: 'Tests with student attempts cannot be deleted' });
        }

        await test.destroy();
        return res.json({ success: true, message: 'Test deleted successfully' });
    } catch (error: any) {
        console.error('Delete test error:', error);
        return res.status(500).json({ message: error.message || 'Error deleting test' });
    }
};

export const getFacultyTests = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;
        const batches = await Batch.findAll({
            where: { FacultyId },
            attributes: ['id', 'name'],
            include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }],
            order: [['createdAt', 'DESC']],
        });

        const batchIds = batches.map((batch: any) => batch.id);
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

        const payload = await Promise.all(
            tests.map(async (test: any) => {
                const [attemptCount, enrolledCount] = await Promise.all([
                    TestResult.count({ where: { testId: test.id } }),
                    Enrollment.count({ where: { batchId: test.batchId } }),
                ]);

                const totalQuestions = Array.isArray(test.questions) ? test.questions.length : 0;

                return {
                    id: test.id,
                    title: test.title,
                    description: test.description || '',
                    totalMarks: Number(test.totalMarks || 0),
                    durationMinutes: Number(test.durationMinutes || 0),
                    dueAt: test.dueAt || null,
                    questions: Array.isArray(test.questions) ? test.questions : [],
                    totalQuestions,
                    createdAt: test.createdAt,
                    batchId: test.batchId,
                    batchName: test.batch?.name || 'Batch',
                    courseId: test.batch?.course?.id || null,
                    courseName: test.batch?.course?.title || 'Course',
                    attemptedStudents: attemptCount,
                    totalStudents: enrolledCount,
                    pendingStudents: Math.max(enrolledCount - attemptCount, 0),
                };
            })
        );

        res.json(payload);
    } catch (error) {
        console.error('Fetch Faculty tests error:', error);
        res.status(500).json({ message: 'Error fetching tests' });
    }
};

export const getTestResults = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;
        const { testId } = req.params;
        const test = await Test.findByPk(testId, {
            include: [{
                model: Batch,
                as: 'batch',
                attributes: ['id', 'name', 'FacultyId'],
                include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }],
            }],
        });

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        const batch = (test as any).batch;
        if (!batch || batch.FacultyId !== FacultyId) {
            return res.status(403).json({ message: 'You do not have access to this test' });
        }

        const [enrollments, results] = await Promise.all([
            Enrollment.findAll({
                where: { batchId: (test as any).batchId },
                include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email'] }],
                order: [['createdAt', 'ASC']],
            }),
            TestResult.findAll({
            where: { testId },
            attributes: TEST_RESULT_BASE_ATTRIBUTES as unknown as string[],
            include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email'] }],
            order: [['submittedAt', 'DESC']],
            }),
        ]);

        const resultByStudentId = new Map<string, any>();
        results.forEach((result: any) => {
            if (!resultByStudentId.has(result.studentId)) {
                resultByStudentId.set(result.studentId, result);
            }
        });

        const totalMarks = Number((test as any).totalMarks || 0);
        const totalQuestions = Array.isArray((test as any).questions) ? (test as any).questions.length : 0;

        const students = enrollments.map((enrollment: any) => {
            const student = enrollment.student;
            const result = resultByStudentId.get(student?.id);

            if (!result) {
                return {
                    studentId: student?.id,
                    studentName: student?.name || 'Student',
                    studentEmail: student?.email || '',
                    attempted: false,
                    score: null,
                    percentage: null,
                    completionTime: null,
                    submittedAt: null,
                    progressPercent: 0,
                    autoSubmitted: false,
                    violationReason: null,
                };
            }

            const percentage = Number.isFinite(Number(result.percentage))
                ? Number(result.percentage)
                : (totalMarks > 0 ? Math.round((Number(result.score || 0) / totalMarks) * 100) : 0);

            return {
                studentId: result.studentId,
                studentName: result.student?.name || student?.name || 'Student',
                studentEmail: result.student?.email || student?.email || '',
                attempted: true,
                score: Number(result.score || 0),
                percentage,
                completionTime: Number(result.completionTime || 0),
                submittedAt: result.submittedAt,
                progressPercent: percentage,
                autoSubmitted: Boolean(result.autoSubmitted),
                violationReason: result.violationReason || null,
            };
        });

        const attemptedStudents = students.filter((student) => student.attempted);
        const attemptedCount = attemptedStudents.length;
        const totalStudents = students.length;
        const unattemptedCount = Math.max(totalStudents - attemptedCount, 0);
        const averageScore = attemptedCount
            ? Number((attemptedStudents.reduce((sum, student) => sum + Number(student.score || 0), 0) / attemptedCount).toFixed(2))
            : 0;
        const averagePercentage = attemptedCount
            ? Number((attemptedStudents.reduce((sum, student) => sum + Number(student.percentage || 0), 0) / attemptedCount).toFixed(2))
            : 0;
        const highestScore = attemptedCount
            ? Math.max(...attemptedStudents.map((student) => Number(student.score || 0)))
            : 0;
        const lowestScore = attemptedCount
            ? Math.min(...attemptedStudents.map((student) => Number(student.score || 0)))
            : 0;

        res.json({
            test: {
                id: (test as any).id,
                title: (test as any).title,
                description: (test as any).description || null,
                totalMarks,
                durationMinutes: Number((test as any).durationMinutes || 0),
                dueAt: (test as any).dueAt || null,
                totalQuestions,
                batchId: (test as any).batchId,
                batchName: batch?.name || 'Batch',
                courseId: batch?.course?.id || null,
                courseName: batch?.course?.title || batch?.name || 'Course',
            },
            summary: {
                totalStudents,
                attemptedStudents: attemptedCount,
                unattemptedStudents: unattemptedCount,
                averageScore,
                averagePercentage,
                highestScore,
                lowestScore,
            },
            students,
        });
    } catch (error) {
        console.error('Fetch test results error:', error);
        res.status(500).json({ message: 'Error fetching analysis' });
    }
};

export const getFacultyAssignments = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;
        const batchContentAttributes = await getBatchContentReadableAttributes();
        const assignmentSubmissionAttributes = await getAssignmentSubmissionReadableAttributes();

        const assignments = await BatchContent.findAll({
            where: { type: 'ASSIGNMENT' },
            attributes: batchContentAttributes as unknown as string[],
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
                    attributes: assignmentSubmissionAttributes as unknown as string[],
                    include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email'] }],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        const batchIds = Array.from(new Set(assignments.map((assignment: any) => assignment.batchId)));
        const enrollments = batchIds.length
            ? await Enrollment.findAll({
                where: {
                    batchId: { [Op.in]: batchIds },
                    status: 'ACTIVE',
                },
                attributes: ['batchId'],
            })
            : [];

        const activeEnrollmentCountByBatchId = enrollments.reduce((acc: Record<string, number>, enrollment: any) => {
            acc[enrollment.batchId] = (acc[enrollment.batchId] || 0) + 1;
            return acc;
        }, {});

        res.json(assignments.map((assignment: any) => ({
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            contentUrl: assignment.contentUrl,
            createdAt: assignment.createdAt,
            batchId: assignment.batchId,
            batchName: assignment.batch?.name || 'Batch',
            courseName: assignment.batch?.course?.title || 'Course',
            maxMarks: resolveAssignmentMaxMarks(assignment.maxMarks),
            submissionStats: {
                totalSubmitted: assignment.submissions?.length || 0,
                pendingReview: assignment.submissions?.filter((item: any) => item.status === 'SUBMITTED').length || 0,
                reviewed: assignment.submissions?.filter((item: any) => item.status === 'REVIEWED').length || 0,
                totalEligibleStudents: activeEnrollmentCountByBatchId[assignment.batchId] || 0,
                unsubmitted: Math.max((activeEnrollmentCountByBatchId[assignment.batchId] || 0) - (assignment.submissions?.length || 0), 0),
            },
            hasSubmissions: Boolean(assignment.submissions?.length),
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

export const getFacultyAssignmentDetail = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;
        const { assignmentId } = req.params;
        const batchContentAttributes = await getBatchContentReadableAttributes();
        const assignmentSubmissionAttributes = await getAssignmentSubmissionReadableAttributes();

        const assignment = await BatchContent.findOne({
            where: { id: assignmentId, type: 'ASSIGNMENT' },
            attributes: batchContentAttributes as unknown as string[],
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
                    attributes: assignmentSubmissionAttributes as unknown as string[],
                    include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email'] }],
                },
            ],
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        const enrollments = await Enrollment.findAll({
            where: {
                batchId: assignment.batchId,
                status: 'ACTIVE',
            },
            include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'isActive'] }],
            order: [['createdAt', 'ASC']],
        });

        const submissions = (assignment as any).submissions || [];
        const submissionByStudentId = new Map<string, any>();
        submissions.forEach((submission: any) => {
            if (!submissionByStudentId.has(submission.studentId)) {
                submissionByStudentId.set(submission.studentId, submission);
            }
        });

        const submittedStudents = submissions
            .slice()
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
            }));

        const unsubmittedStudents = enrollments
            .filter((enrollment: any) => !submissionByStudentId.has(enrollment.studentId))
            .map((enrollment: any) => ({
                studentId: enrollment.studentId,
                studentName: enrollment.student?.name || 'Student',
                studentEmail: enrollment.student?.email || '',
                enrollmentStatus: enrollment.status,
            }));

        const reviewedCount = submittedStudents.filter((item: any) => item.status === 'REVIEWED').length;

        return res.json({
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            contentUrl: assignment.contentUrl,
            createdAt: assignment.createdAt,
            batchId: assignment.batchId,
            batchName: (assignment as any).batch?.name || 'Batch',
            courseName: (assignment as any).batch?.course?.title || 'Course',
            maxMarks: resolveAssignmentMaxMarks((assignment as any).maxMarks),
            hasSubmissions: submittedStudents.length > 0,
            submissionStats: {
                totalSubmitted: submittedStudents.length,
                pendingReview: submittedStudents.length - reviewedCount,
                reviewed: reviewedCount,
                totalEligibleStudents: enrollments.length,
                unsubmitted: unsubmittedStudents.length,
            },
            submittedStudents,
            unsubmittedStudents,
        });
    } catch (error: any) {
        console.error('Fetch faculty assignment detail error:', error);
        return res.status(500).json({ message: error.message || 'Error fetching assignment detail' });
    }
};

export const reviewAssignmentSubmission = async (req: any, res: Response) => {
    try {
        const FacultyId = req.user.id;
        const { submissionId } = req.params;
        const { grade, feedback } = req.body;
        const batchContentAttributes = await getBatchContentReadableAttributes();
        const assignmentSubmissionAttributes = await getAssignmentSubmissionReadableAttributes();

        const submission = await AssignmentSubmission.findByPk(submissionId, {
            attributes: assignmentSubmissionAttributes as unknown as string[],
            include: [
                {
                    model: Batch,
                    as: 'batch',
                    attributes: ['id', 'name', 'FacultyId'],
                    include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }],
                },
                { model: BatchContent, as: 'assignment', attributes: batchContentAttributes as unknown as string[] },
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
        const assignment = (submission as any).assignment;
        const maxMarks = resolveAssignmentMaxMarks(assignment?.maxMarks);

        if (normalizedGrade !== null && (!Number.isFinite(normalizedGrade) || normalizedGrade < 0 || normalizedGrade > maxMarks)) {
            return res.status(400).json({ message: `grade must be between 0 and ${maxMarks}` });
        }

        submission.grade = normalizedGrade;
        submission.feedback = typeof feedback === 'string' ? feedback.trim() : null;
        submission.status = 'REVIEWED';
        await submission.save();

        const batch = (submission as any).batch;
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
                maxMarks,
            },
        });
    } catch (error: any) {
        console.error('Review assignment submission error:', error);
        res.status(500).json({ message: error.message || 'Error reviewing assignment submission' });
    }
};
