import { Request, Response } from 'express';
import { Op } from 'sequelize';
import slugify from 'slugify';
import Course from '../models/Course';
import Batch from '../models/Batch';
import User from '../models/User';

const normalizeCourseStatus = (status?: string) => {
    const normalized = (status || 'DRAFT').toUpperCase();
    if (!['ACTIVE', 'DRAFT', 'ARCHIVED'].includes(normalized)) throw new Error('Invalid course status');
    return normalized as 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
};

const ensureTeacher = async (teacherId: string) => {
    const teacher = await User.findByPk(teacherId);
    if (!teacher || teacher.role !== 'TEACHER') throw new Error('Teacher not found');
    return teacher;
};

export const getAllCourses = async (req: Request, res: Response) => {
    try {
        const courses = await Course.findAll({
            include: [{ model: User, as: 'instructor', attributes: ['id', 'username', 'name', 'email', 'specialization'] }],
            order: [['createdAt', 'DESC']],
        });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching courses' });
    }
};

export const createCourse = async (req: Request, res: Response) => {
    try {
        const { title, price, duration, category, instructorId, status } = req.body;
        if (!title || !instructorId) return res.status(400).json({ message: 'title and instructorId are required' });

        await ensureTeacher(instructorId as string);
        const normalizedStatus = normalizeCourseStatus(status);
        const slugBase = slugify(title, { lower: true, strict: true, replacement: '-' });
        let slug = slugBase;
        let counter = 1;
        while (await Course.findOne({ where: { slug } })) {
            slug = `${slugBase}-${counter}`;
            counter += 1;
        }

        const course = await Course.create({
            title,
            price: price || 0,
            duration,
            category,
            instructorId,
            status: normalizedStatus,
            isPublished: normalizedStatus === 'ACTIVE',
            slug,
        });

        const created = await Course.findByPk(course.id, {
            include: [{ model: User, as: 'instructor', attributes: ['id', 'username', 'name', 'email', 'specialization'] }],
        });
        res.status(201).json({ message: 'Course created successfully', course: created });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Server error during course creation' });
    }
};

export const updateCourse = async (req: Request, res: Response) => {
    try {
        const courseId = req.params.id as string;
        const course = await Course.findByPk(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const updates: any = {
            title: req.body.title,
            price: req.body.price,
            duration: req.body.duration,
            category: req.body.category,
            instructorId: req.body.instructorId,
            status: req.body.status,
        };
        Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);
        if (updates.instructorId) await ensureTeacher(updates.instructorId as string);
        if (updates.title) {
            const slugBase = slugify(updates.title, { lower: true, strict: true, replacement: '-' });
            let slug = slugBase;
            let counter = 1;
            while (await Course.findOne({ where: { slug, id: { [Op.ne]: courseId } } })) {
                slug = `${slugBase}-${counter}`;
                counter += 1;
            }
            updates.slug = slug;
        }
        if (updates.status) {
            updates.status = normalizeCourseStatus(updates.status);
            updates.isPublished = updates.status === 'ACTIVE';
        }

        await course.update(updates);
        const updated = await Course.findByPk(courseId, {
            include: [{ model: User, as: 'instructor', attributes: ['id', 'username', 'name', 'email', 'specialization'] }],
        });

        res.json({ message: 'Course updated successfully', course: updated });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Server error during course update' });
    }
};

export const deleteCourse = async (req: Request, res: Response) => {
    try {
        const courseId = req.params.id as string;
        await Course.destroy({ where: { id: courseId } });
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during course deletion' });
    }
};

export const updateBatch = async (req: Request, res: Response) => {
    try {
        const batchId = req.params.id as string;
        const batch = await Batch.findByPk(batchId);
        if (!batch) return res.status(404).json({ message: 'Batch not found' });

        if (req.body.teacherId) await ensureTeacher(req.body.teacherId as string);
        if (req.body.courseId) {
            const course = await Course.findByPk(req.body.courseId as string);
            if (!course) return res.status(404).json({ message: 'Course not found' });
        }

        await batch.update(req.body);
        const updated = await Batch.findByPk(batchId, {
            include: [
                { model: Course, as: 'course' },
                { model: User, as: 'teacher', attributes: ['id', 'username', 'name', 'email', 'specialization'] },
            ],
        });
        res.json({ message: 'Batch updated successfully', batch: updated });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Server error during batch update' });
    }
};
