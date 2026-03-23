import { Response } from 'express';
import NotificationRecipient from '../models/NotificationRecipient';
import Notification from '../models/Notification';
import User from '../models/User';
import Batch from '../models/Batch';
import Course from '../models/Course';
import { filterCurrentLiveClassNotificationRecipients } from '../utils/liveClassNotifications';

export const getMyNotifications = async (req: any, res: Response) => {
    try {
        const notifications = await NotificationRecipient.findAll({
            where: { userId: req.user.id },
            include: [{
                model: Notification,
                as: 'notification',
                include: [
                    { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
                    { model: Batch, as: 'batch', attributes: ['id', 'name'] },
                    { model: Course, as: 'course', attributes: ['id', 'title'] },
                ],
            }],
            order: [['createdAt', 'DESC']],
        });

        const filteredNotifications = await filterCurrentLiveClassNotificationRecipients(notifications as any[]);

        res.json(filteredNotifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

export const markNotificationAsRead = async (req: any, res: Response) => {
    try {
        const recipient = await NotificationRecipient.findOne({
            where: { notificationId: req.params.notificationId, userId: req.user.id },
        });

        if (!recipient) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        recipient.readAt = new Date();
        await recipient.save();
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating notification' });
    }
};
