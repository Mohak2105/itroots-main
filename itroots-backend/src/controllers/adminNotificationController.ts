import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Announcement from '../models/Announcement';
import User from '../models/User';
import Batch from '../models/Batch';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import Notification, { NotificationAudience, NotificationType } from '../models/Notification';
import NotificationRecipient from '../models/NotificationRecipient';
import Placement from '../models/Placement';
import sequelize from '../config/database';
import { sendNotificationEmail } from '../services/mailer';
import { getNotificationWriteErrorMessage } from '../utils/notificationErrors';
import { isPlacementExpired } from '../utils/placements';

const ACTIVE_USER_FILTER = { isActive: true };
const formatPlacementDueDate = (value?: Date | string | null) => {
    if (!value) return '';
    const dueDate = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dueDate.getTime())) return '';

    return dueDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const dedupeUsers = (users: any[]) => {
    const seen = new Map<string, any>();
    users.forEach((user) => {
        if (user?.id && user.isActive !== false && !seen.has(user.id)) {
            seen.set(user.id, user);
        }
    });
    return Array.from(seen.values());
};

const getSelectedUsers = async (role: 'STUDENT' | 'Faculty', recipientIds?: string[]) => {
    return User.findAll({
        where: {
            id: recipientIds || [],
            role,
            ...ACTIVE_USER_FILTER,
        },
        order: [['name', 'ASC']],
    });
};

const getBatchRecipients = async (batchId: string, includeStudents: boolean, includeFaculty: boolean) => {
    const batch = await Batch.findByPk(batchId, {
        include: [{ model: User, as: 'Faculty', attributes: ['id', 'name', 'email', 'role', 'isActive'] }],
    });

    if (!batch) {
        throw new Error('Selected batch was not found');
    }

    const recipients: any[] = [];

    if (includeFaculty && (batch as any).Faculty?.isActive) {
        recipients.push((batch as any).Faculty);
    }

    if (includeStudents) {
        const enrollments = await Enrollment.findAll({
            where: {
                batchId,
                status: { [Op.in]: ['ACTIVE', 'COMPLETED'] },
            },
            include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'role', 'isActive'] }],
        });

        enrollments.forEach((enrollment: any) => {
            if (enrollment.student?.isActive) {
                recipients.push(enrollment.student);
            }
        });
    }

    return dedupeUsers(recipients);
};

const getCourseRecipients = async (courseId: string, includeStudents: boolean, includeFaculty: boolean) => {
    const course = await Course.findByPk(courseId, {
        include: [{ model: User, as: 'instructor', attributes: ['id', 'name', 'email', 'role', 'isActive'] }],
    });

    if (!course) {
        throw new Error('Selected course was not found');
    }

    const batches = await Batch.findAll({
        where: { courseId },
        include: [{ model: User, as: 'Faculty', attributes: ['id', 'name', 'email', 'role', 'isActive'] }],
    });

    const recipients: any[] = [];

    if (includeFaculty) {
        batches.forEach((batch: any) => {
            if (batch.Faculty?.isActive) {
                recipients.push(batch.Faculty);
            }
        });

        if ((course as any).instructor?.isActive) {
            recipients.push((course as any).instructor);
        }
    }

    if (includeStudents && batches.length > 0) {
        const batchIds = batches.map((batch: any) => batch.id);
        const enrollments = await Enrollment.findAll({
            where: {
                batchId: { [Op.in]: batchIds },
                status: { [Op.in]: ['ACTIVE', 'COMPLETED'] },
            },
            include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'role', 'isActive'] }],
        });

        enrollments.forEach((enrollment: any) => {
            if (enrollment.student?.isActive) {
                recipients.push(enrollment.student);
            }
        });
    }

    return dedupeUsers(recipients);
};

const getRecipientsForAudience = async (
    audienceType: NotificationAudience,
    options: {
        recipientIds?: string[];
        batchId?: string;
        courseId?: string;
    }
) => {
    switch (audienceType) {
        case 'ALL_STUDENTS':
            return User.findAll({ where: { role: 'STUDENT', ...ACTIVE_USER_FILTER }, order: [['name', 'ASC']] });
        case 'ALL_Faculty':
            return User.findAll({ where: { role: 'Faculty', ...ACTIVE_USER_FILTER }, order: [['name', 'ASC']] });
        case 'ALL_USERS':
            return User.findAll({
                where: {
                    role: { [Op.in]: ['STUDENT', 'Faculty', 'CMS_MANAGER', 'SUPER_ADMIN'] },
                    ...ACTIVE_USER_FILTER,
                },
                order: [['name', 'ASC']],
            });
        case 'SELECTED_STUDENTS':
            return getSelectedUsers('STUDENT', options.recipientIds);
        case 'SELECTED_Faculty':
            return getSelectedUsers('Faculty', options.recipientIds);
        case 'SELECTED_BATCH':
            if (!options.batchId) throw new Error('batchId is required for selected batch notifications');
            return getBatchRecipients(options.batchId, true, true);
        case 'SELECTED_BATCH_STUDENTS':
            if (!options.batchId) throw new Error('batchId is required for selected batch notifications');
            return getBatchRecipients(options.batchId, true, false);
        case 'SELECTED_BATCH_Faculty':
            if (!options.batchId) throw new Error('batchId is required for selected batch Faculty notifications');
            return getBatchRecipients(options.batchId, false, true);
        case 'SELECTED_COURSE':
            if (!options.courseId) throw new Error('courseId is required for selected course notifications');
            return getCourseRecipients(options.courseId, true, true);
        case 'SELECTED_COURSE_STUDENTS':
            if (!options.courseId) throw new Error('courseId is required for selected course student notifications');
            return getCourseRecipients(options.courseId, true, false);
        case 'SELECTED_COURSE_Faculty':
            if (!options.courseId) throw new Error('courseId is required for selected course Faculty notifications');
            return getCourseRecipients(options.courseId, false, true);
        default:
            throw new Error('Invalid audience type');
    }
};

export const createAdminAnnouncement = async (req: any, res: Response) => {
    try {
        const { batchId, title, content, priority } = req.body;
        const announcement = await Announcement.create({
            batchId: batchId || undefined,
            title,
            content,
            priority: priority || 'NORMAL',
            authorId: req.user.id,
        });

        const created = await Announcement.findByPk((announcement as any).id, {
            include: [
                { model: User, as: 'author', attributes: ['id', 'name', 'email', 'role'] },
                { model: Batch, as: 'batch', attributes: ['id', 'name'] },
            ],
        });

        res.status(201).json({ message: 'Announcement created successfully', announcement: created });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Server error creating announcement' });
    }
};

export const getAnnouncements = async (req: Request, res: Response) => {
    try {
        const announcements = await Announcement.findAll({
            include: [
                { model: User, as: 'author', attributes: ['id', 'name', 'email', 'role'] },
                { model: Batch, as: 'batch', attributes: ['id', 'name'] },
            ],
            order: [['createdAt', 'DESC']],
        });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching announcements' });
    }
};

export const createTargetedNotification = async (req: any, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            title,
            message,
            audienceType,
            recipientIds,
            sendEmail,
            batchId,
            courseId,
            type,
        } = req.body as {
            title?: string;
            message?: string;
            audienceType?: NotificationAudience;
            recipientIds?: string[];
            sendEmail?: boolean;
            batchId?: string;
            courseId?: string;
            type?: NotificationType;
        };

        if (!title || !message || !audienceType) {
            await transaction.rollback();
            return res.status(400).json({ message: 'title, message and audienceType are required' });
        }

        const notificationType: NotificationType = type || 'NOTIFICATION';
        const recipients = await getRecipientsForAudience(audienceType, { recipientIds, batchId, courseId });

        if (!recipients.length) {
            await transaction.rollback();
            return res.status(400).json({ message: 'No recipients found for the selected audience' });
        }

        const notification = await Notification.create({
            title,
            message,
            type: notificationType,
            audienceType,
            sendEmail: Boolean(sendEmail),
            createdBy: req.user.id,
            batchId: batchId || undefined,
            courseId: courseId || undefined,
        }, { transaction });

        await NotificationRecipient.bulkCreate(
            recipients.map((recipient: any) => ({
                notificationId: notification.id,
                userId: recipient.id,
                emailSent: false,
            })),
            { transaction }
        );

        await transaction.commit();

        if (sendEmail) {
            await Promise.all(recipients.map(async (recipient: any) => {
                await sendNotificationEmail({
                    to: recipient.email,
                    name: recipient.name,
                    title,
                    message,
                });
                await NotificationRecipient.update(
                    { emailSent: true, emailSentAt: new Date() },
                    { where: { notificationId: notification.id, userId: recipient.id } }
                );
            }));
        }

        const created = await Notification.findByPk(notification.id, {
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
                { model: Batch, as: 'batch', attributes: ['id', 'name'] },
                { model: Course, as: 'course', attributes: ['id', 'title'] },
                { model: NotificationRecipient, as: 'recipients', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }] },
            ],
        });

        res.status(201).json({
            message: 'Notification sent successfully',
            recipientCount: recipients.length,
            notification: created,
        });
    } catch (error: any) {
        await transaction.rollback();
        res.status(500).json({ message: getNotificationWriteErrorMessage(error, 'Server error sending notification') });
    }
};

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const notifications = await Notification.findAll({
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
                { model: Batch, as: 'batch', attributes: ['id', 'name'] },
                { model: Course, as: 'course', attributes: ['id', 'title'] },
                { model: NotificationRecipient, as: 'recipients', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }] },
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

export const sendPlacementNotification = async (req: any, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
        const placementId = String(req.params.placementId || '').trim();
        if (!placementId) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Placement id is required' });
        }

        const placement = await Placement.findByPk(placementId);
        if (!placement) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Placement not found' });
        }

        if (isPlacementExpired(placement)) {
            await transaction.rollback();
            return res.status(400).json({ message: 'This placement has expired and can no longer be sent to students' });
        }

        const recipients = await User.findAll({
            where: {
                role: 'STUDENT',
                ...ACTIVE_USER_FILTER,
            },
            attributes: ['id', 'name', 'email'],
            order: [['name', 'ASC']],
        });

        if (!recipients.length) {
            await transaction.rollback();
            return res.status(400).json({ message: 'No active students available to receive this placement' });
        }

        const placementPath = `/placements?placementId=${encodeURIComponent(placement.id)}`;
        const notification = await Notification.create({
            title: `Placement Opportunity: ${placement.companyName}`,
            message: [
                `A new placement opportunity is available.`,
                `Company: ${placement.companyName}`,
                `Role: ${placement.designation}`,
                `Salary: ${placement.salaryRange}`,
                `Eligible Passout Years: ${placement.passoutYears}`,
                placement.dueDate ? `Apply Before: ${formatPlacementDueDate(placement.dueDate)}` : null,
                `View in LMS: ${placementPath}`,
            ].filter(Boolean).join('\n'),
            type: 'PLACEMENT',
            audienceType: 'ALL_STUDENTS',
            sendEmail: false,
            createdBy: req.user.id,
        }, { transaction });

        await NotificationRecipient.bulkCreate(
            recipients.map((recipient: any) => ({
                notificationId: notification.id,
                userId: recipient.id,
                emailSent: false,
            })),
            { transaction }
        );

        await transaction.commit();

        res.status(201).json({
            message: 'Placement sent successfully',
            recipientCount: recipients.length,
            notificationId: notification.id,
        });
    } catch (error: any) {
        await transaction.rollback();
        res.status(500).json({ message: error.message || 'Server error sending placement notification' });
    }
};

export const deleteNotification = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
        const rawId = req.params.id;
        const id = Array.isArray(rawId) ? rawId[0] : rawId;

        if (!id) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Notification id is required' });
        }

        const notification = await Notification.findByPk(id, { transaction });
        if (!notification) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Notification not found' });
        }

        await NotificationRecipient.destroy({
            where: { notificationId: id },
            transaction,
        });

        await notification.destroy({ transaction });
        await transaction.commit();

        return res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ message: 'Server error deleting notification' });
    }
};
