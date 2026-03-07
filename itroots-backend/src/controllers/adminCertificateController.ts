import { Response } from 'express';
import Certificate from '../models/Certificate';
import User from '../models/User';
import Course from '../models/Course';
import Batch from '../models/Batch';
import Enrollment from '../models/Enrollment';
import Notification from '../models/Notification';
import NotificationRecipient from '../models/NotificationRecipient';
import { streamCertificatePdf } from '../utils/certificatePdf';

const certificateInclude = [
    { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
    { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
    { model: Course, as: 'course', attributes: ['id', 'title', 'duration', 'category'] },
    { model: Batch, as: 'batch', attributes: ['id', 'name', 'schedule'] },
];

const generateCertificateNumber = () => {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `ITR-CERT-${datePart}-${randomPart}`;
};

const getCertificateRecord = async (certificateId: string) => Certificate.findByPk(certificateId, {
    include: certificateInclude,
});

const ensureStudentCourseAccess = async (studentId: string, courseId: string) => {
    const student = await User.findByPk(studentId);
    if (!student || student.role !== 'STUDENT') {
        throw new Error('Student not found');
    }

    const course = await Course.findByPk(courseId);
    if (!course) {
        throw new Error('Course not found');
    }

    const enrollment = await Enrollment.findOne({
        where: { studentId },
        include: [{ model: Batch, as: 'batch', where: { courseId }, required: true }],
        order: [['createdAt', 'DESC']],
    });

    if (!enrollment) {
        throw new Error('Selected student is not assigned to this course');
    }

    return {
        student,
        course,
        batchId: (enrollment as any).batchId,
    };
};

const notifyStudentCertificateIssued = async ({
    certificate,
    adminId,
}: {
    certificate: any;
    adminId: string;
}) => {
    const message = [
        `Your certificate for ${certificate.course?.title || 'the course'} is ready.`,
        `Certificate No: ${certificate.certificateNumber}`,
        `Issue Date: ${new Date(certificate.issueDate).toLocaleDateString('en-IN')}`,
        'Open the Certificates section in your student dashboard to view or download the PDF.',
    ].join('\n');

    const notification = await Notification.create({
        title: `Certificate Issued: ${certificate.course?.title || 'Course'}`,
        message,
        type: 'NOTIFICATION',
        audienceType: 'SELECTED_STUDENTS',
        sendEmail: false,
        createdBy: adminId,
        batchId: certificate.batchId,
        courseId: certificate.courseId,
    });

    await NotificationRecipient.findOrCreate({
        where: {
            notificationId: notification.id,
            userId: certificate.studentId,
        },
        defaults: {
            notificationId: notification.id,
            userId: certificate.studentId,
            emailSent: false,
        },
    });
};

export const getCertificates = async (req: any, res: Response) => {
    try {
        const certificates = await Certificate.findAll({
            include: certificateInclude,
            order: [['updatedAt', 'DESC']],
        });
        res.json(certificates);
    } catch (error) {
        console.error('Fetch certificates error:', error);
        res.status(500).json({ message: 'Error fetching certificates' });
    }
};

export const createCertificate = async (req: any, res: Response) => {
    try {
        const adminId = req.user.id;
        const { studentId, courseId, duration, signatoryName, signatoryTitle, issueDate } = req.body;

        if (!studentId || !courseId || !duration || !signatoryName) {
            return res.status(400).json({ message: 'studentId, courseId, duration and signatoryName are required' });
        }

        const { batchId } = await ensureStudentCourseAccess(studentId, courseId);
        const normalizedIssueDate = issueDate || new Date().toISOString().slice(0, 10);

        let certificate = await Certificate.findOne({ where: { studentId, courseId } });

        if (certificate) {
            await certificate.update({
                batchId,
                duration,
                signatoryName,
                signatoryTitle,
                issueDate: normalizedIssueDate,
                createdBy: adminId,
            });
        } else {
            let certificateNumber = generateCertificateNumber();
            while (await Certificate.findOne({ where: { certificateNumber } })) {
                certificateNumber = generateCertificateNumber();
            }

            certificate = await Certificate.create({
                certificateNumber,
                studentId,
                courseId,
                batchId,
                duration,
                signatoryName,
                signatoryTitle,
                issueDate: normalizedIssueDate,
                createdBy: adminId,
            });
        }

        const fullCertificate = await getCertificateRecord(certificate.id);
        await notifyStudentCertificateIssued({ certificate: fullCertificate, adminId });
        res.status(201).json({ message: 'Certificate generated successfully', certificate: fullCertificate });
    } catch (error: any) {
        console.error('Create certificate error:', error);
        res.status(500).json({ message: error.message || 'Error generating certificate' });
    }
};

export const downloadCertificate = async (req: any, res: Response) => {
    try {
        const certificate = await getCertificateRecord(req.params.id as string);
        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        streamCertificatePdf(res, certificate);
    } catch (error: any) {
        console.error('Download certificate error:', error);
        res.status(500).json({ message: error.message || 'Error downloading certificate' });
    }
};
