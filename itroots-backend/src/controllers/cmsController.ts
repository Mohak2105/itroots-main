import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import Course from '../models/Course';
import Lead from '../models/Lead';
import Placement from '../models/Placement';
import Batch from '../models/Batch';
import sequelize from '../config/database';
import slugify from 'slugify';
import { parsePlacementDueDate } from '../utils/placements';

const COMPANY_LOGO_DIR = path.join(__dirname, '..', '..', 'uploads', 'company-logos');

function saveCompanyLogo(fileData: string): string {
    const match = fileData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) throw new Error('Invalid image payload');

    const [, mimeType, base64Payload] = match;
    const ext = mimeType.split('/')[1]?.toLowerCase() === 'jpeg' ? 'jpg' : (mimeType.split('/')[1]?.toLowerCase() || 'png');
    const storedFileName = `${Date.now()}-logo.${ext}`;

    fs.mkdirSync(COMPANY_LOGO_DIR, { recursive: true });
    fs.writeFileSync(path.join(COMPANY_LOGO_DIR, storedFileName), Buffer.from(base64Payload, 'base64'));

    return `/uploads/company-logos/${storedFileName}`;
}

export const createCourse = async (req: Request | any, res: Response) => {
    try {
        const { title, description, thumbnail, price, category } = req.body;

        // Auto-generate slug
        const slug = slugify(title, { lower: true, strict: true, replacement: '-' });

        const newCourse = await Course.create({
            title,
            description,
            thumbnail,
            price: price || 0,
            category,
            slug,
            instructorId: req.user?.id,
            isPublished: false,
        });

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            course: newCourse,
        });
    } catch (error) {
        console.error('Course creation error:', error);
        res.status(500).json({ message: 'Server error during course creation' });
    }
};

export const updateCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.title) {
            updates.slug = slugify(updates.title, { lower: true, strict: true, replacement: '-' });
        }

        const [updatedCount] = await Course.update(updates, { where: { id } });

        if (updatedCount === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json({ message: 'Course updated successfully' });
    } catch (error) {
        console.error('Course update error:', error);
        res.status(500).json({ message: 'Server error during course update' });
    }
};

export const getAllCourses = async (req: Request, res: Response) => {
    try {
        const courses = await Course.findAll({
            include: ['instructor'],
        });
        res.json(courses);
    } catch (error) {
        console.error('Fetch courses error:', error);
        res.status(500).json({ message: 'Server error during fetching courses' });
    }
};

export const deleteCourse = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;

        // Delete all related records that reference this course or its batches
        const batchIds = (await Batch.findAll({ where: { courseId: id }, attributes: ['id'], transaction })).map(b => b.id);

        if (batchIds.length > 0) {
            await sequelize.query('DELETE FROM enrollments WHERE batchId IN (:batchIds)', { replacements: { batchIds }, transaction });
            await sequelize.query('DELETE FROM faculty_batches WHERE batchId IN (:batchIds)', { replacements: { batchIds }, transaction });
            await sequelize.query('DELETE FROM live_classes WHERE batchId IN (:batchIds)', { replacements: { batchIds }, transaction }).catch(() => {});
            await sequelize.query('DELETE FROM attendances WHERE batchId IN (:batchIds)', { replacements: { batchIds }, transaction }).catch(() => {});
            await sequelize.query('DELETE FROM announcements WHERE batchId IN (:batchIds)', { replacements: { batchIds }, transaction }).catch(() => {});
        }

        await sequelize.query('DELETE FROM certificates WHERE courseId = :id', { replacements: { id }, transaction }).catch(() => {});
        await sequelize.query('DELETE FROM notifications WHERE courseId = :id', { replacements: { id }, transaction }).catch(() => {});
        await sequelize.query('DELETE FROM payments WHERE courseId = :id', { replacements: { id }, transaction }).catch(() => {});
        await Batch.destroy({ where: { courseId: id }, transaction });
        await Course.destroy({ where: { id }, transaction });

        await transaction.commit();
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        await transaction.rollback();
        console.error('Delete course error:', error);
        res.status(500).json({ message: 'Server error during course deletion' });
    }
};

/**
 * LEAD MANAGEMENT (READ ONLY FOR CMS)
 */
export const getAllLeads = async (req: Request, res: Response) => {
    try {
        const leads = await Lead.findAll({ order: [['createdAt', 'DESC']] });
        res.json(leads);
    } catch (error) {
        console.error('Fetch leads error:', error);
        res.status(500).json({ message: 'Error fetching leads' });
    }
};

/**
 * PLACEMENT MANAGEMENT
 */
export const getAllPlacements = async (req: Request, res: Response) => {
    try {
        const placements = await Placement.findAll({ order: [['createdAt', 'DESC']] });
        res.json(placements);
    } catch (error) {
        console.error('Fetch placements error:', error);
        res.status(500).json({ message: 'Error fetching placements' });
    }
};

export const createPlacement = async (req: Request, res: Response) => {
    try {
        const data = { ...req.body };
        const parsedDueDate = parsePlacementDueDate(data.dueDate);

        if (!parsedDueDate) {
            return res.status(400).json({ message: 'A valid dueDate is required for placements' });
        }

        if (data.companyLogo && data.companyLogo.startsWith('data:image/')) {
            data.companyLogo = saveCompanyLogo(data.companyLogo);
        }

        data.dueDate = parsedDueDate;
        const placement = await Placement.create(data);
        res.status(201).json(placement);
    } catch (error) {
        console.error('Create placement error:', error);
        res.status(500).json({ message: 'Error creating placement' });
    }
};

export const deletePlacement = async (req: Request, res: Response) => {
    try {
        await Placement.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Placement deleted successfully' });
    } catch (error) {
        console.error('Delete placement error:', error);
        res.status(500).json({ message: 'Error deleting placement' });
    }
};
