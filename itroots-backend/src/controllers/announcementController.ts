import { Request, Response } from 'express';
import Announcement from '../models/Announcement';
import Batch from '../models/Batch';
import User from '../models/User';
import Enrollment from '../models/Enrollment';

export const createAnnouncement = async (req: Request, res: Response) => {
    try {
        const { batchId, title, content, priority } = req.body;
        const authorId = (req as any).user.id;

        if (batchId) {
            // Verify Faculty owns the batch
            const batch = await Batch.findOne({ where: { id: batchId, FacultyId: authorId } });
            if (!batch && (req as any).user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ message: 'Not authorized for this batch' });
            }
        }

        const announcement = await Announcement.create({
            batchId: batchId || null,
            authorId,
            title,
            content,
            priority
        });

        res.status(201).json({ success: true, data: announcement });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBatchAnnouncements = async (req: Request, res: Response) => {
    try {
        const { batchId } = req.params;

        const announcements = await Announcement.findAll({
            where: { batchId },
            include: [{ model: User, as: 'author', attributes: ['name', 'role'] }],
            order: [['createdAt', 'DESC']]
        });

        res.json({ success: true, data: announcements });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getGlobalAnnouncements = async (req: Request, res: Response) => {
    try {
        const announcements = await Announcement.findAll({
            where: { batchId: null },
            include: [{ model: User, as: 'author', attributes: ['name', 'role'] }],
            order: [['createdAt', 'DESC']]
        });

        res.json({ success: true, data: announcements });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStudentAnnouncements = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user.id;

        // Find batches the student is enrolled in
        const enrollments = await Enrollment.findAll({ where: { studentId } });
        const batchIds = enrollments.map((e: any) => e.batchId);

        // Fetch global announcements (batchId: null) or announcements for enrolled batches
        const announcements = await Announcement.findAll({
            where: {
                [require('sequelize').Op.or]: [
                    { batchId: null },
                    { batchId: batchIds }
                ]
            },
            include: [
                { model: User, as: 'author', attributes: ['name', 'role'] },
                { model: Batch, as: 'batch', attributes: ['name'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({ success: true, data: announcements });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
