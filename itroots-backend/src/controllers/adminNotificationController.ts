import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Announcement from '../models/Announcement';
import User from '../models/User';
import Batch from '../models/Batch';
import Notification from '../models/Notification';
import NotificationRecipient from '../models/NotificationRecipient';
import sequelize from '../config/database';
import { sendNotificationEmail } from '../services/mailer';

const getRecipientsForAudience = async (audienceType: string, recipientIds?: string[]) => {
    if (audienceType === 'ALL_STUDENTS') return User.findAll({ where: { role: 'STUDENT', isActive: true } });
    if (audienceType === 'ALL_TEACHERS') return User.findAll({ where: { role: 'TEACHER', isActive: true } });
    if (audienceType === 'ALL_USERS') {
        return User.findAll({ where: { isActive: true, role: { [Op.in]: ['STUDENT', 'TEACHER', 'CMS_MANAGER', 'SUPER_ADMIN'] } } });
    }
    if (audienceType === 'SELECTED_STUDENTS') {
        return User.findAll({ where: { id: recipientIds || [], role: 'STUDENT', isActive: true } });
    }
    if (audienceType === 'SELECTED_TEACHERS') {
        return User.findAll({ where: { id: recipientIds || [], role: 'TEACHER', isActive: true } });
    }
    throw new Error('Invalid audience type');
};

export const createAdminAnnouncement = async (req: any, res: Response) => {
    try {
        const { batchId, title, content, priority } = req.body;
        const announcement = await Announcement.create({
            batchId: batchId || null,
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
        const { title, message, audienceType, recipientIds, sendEmail, batchId, courseId } = req.body;
        if (!title || !message || !audienceType) {
            await transaction.rollback();
            return res.status(400).json({ message: 'title, message and audienceType are required' });
        }

        const recipients = await getRecipientsForAudience(audienceType, recipientIds);
        if (!recipients.length) {
            await transaction.rollback();
            return res.status(400).json({ message: 'No recipients found for the selected audience' });
        }

        const notification = await Notification.create({
            title,
            message,
            type: 'NOTIFICATION',
            audienceType,
            sendEmail: Boolean(sendEmail),
            createdBy: req.user.id,
            batchId: batchId || null,
            courseId: courseId || null,
        }, { transaction });

        await NotificationRecipient.bulkCreate(recipients.map((recipient: any) => ({
            notificationId: notification.id,
            userId: recipient.id,
            emailSent: false,
        })), { transaction });

        await transaction.commit();

        if (sendEmail) {
            await Promise.all(recipients.map(async (recipient: any) => {
                await sendNotificationEmail({ to: recipient.email, name: recipient.name, title, message });
                await NotificationRecipient.update(
                    { emailSent: true, emailSentAt: new Date() },
                    { where: { notificationId: notification.id, userId: recipient.id } }
                );
            }));
        }

        const created = await Notification.findByPk(notification.id, {
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
                { model: NotificationRecipient, as: 'recipients', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }] },
            ],
        });

        res.status(201).json({ message: 'Notification sent successfully', notification: created });
    } catch (error: any) {
        await transaction.rollback();
        res.status(500).json({ message: error.message || 'Server error sending notification' });
    }
};

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const notifications = await Notification.findAll({
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
                { model: NotificationRecipient, as: 'recipients', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }] },
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

