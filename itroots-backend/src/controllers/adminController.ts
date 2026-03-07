import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import User from '../models/User';
import Batch from '../models/Batch';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import Payment from '../models/Payment';

export const getAdminDashboard = async (req: Request, res: Response) => {
    try {
        const [students, teachers, courses, batches, recentStudents, totalRevenue, pendingPayments] = await Promise.all([
            User.count({ where: { role: 'STUDENT' } }),
            User.count({ where: { role: 'TEACHER' } }),
            Course.count(),
            Batch.count(),
            User.findAll({
                where: { role: 'STUDENT' },
                attributes: ['id', 'username', 'name', 'email', 'createdAt', 'isActive'],
                order: [['createdAt', 'DESC']],
                limit: 5,
            }),
            Payment.sum('amount', { where: { status: { [Op.in]: ['PAID', 'PARTIAL'] } } }),
            Payment.count({ where: { status: 'PENDING' } }),
        ]);

        res.json({
            students,
            teachers,
            courses,
            batches,
            revenue: Number(totalRevenue || 0),
            pendingPayments,
            recentStudents,
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ message: 'Server error fetching dashboard' });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']],
        });
        res.json(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ message: 'Server error during fetching users' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role, isActive, name, email, phone, username, specialization } = req.body;

        const user = await User.findByPk(id as string);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (role) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone !== undefined) user.phone = phone;
        if (username !== undefined) user.username = username;
        if (specialization !== undefined) user.specialization = specialization;

        await user.save();

        res.json({
            message: 'User updated successfully',
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                specialization: user.specialization,
                isActive: user.isActive,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error during updating user' });
    }
};

export const getSystemStats = async (req: Request, res: Response) => {
    try {
        const [totalUsers, totalStudents, totalTeachers, totalBatches, totalRevenue] = await Promise.all([
            User.count(),
            User.count({ where: { role: 'STUDENT' } }),
            User.count({ where: { role: 'TEACHER' } }),
            Batch.count(),
            Payment.sum('amount', { where: { status: { [Op.in]: ['PAID', 'PARTIAL'] } } }),
        ]);

        res.json({
            stats: {
                totalUsers,
                totalStudents,
                totalTeachers,
                totalBatches,
                totalRevenue: Number(totalRevenue || 0),
                systemStatus: 'Optimal',
                uptime: process.uptime(),
            },
        });
    } catch (error) {
        console.error('System Stats error:', error);
        res.status(500).json({ message: 'Server error fetching system stats' });
    }
};

export const getAllBatches = async (req: Request, res: Response) => {
    try {
        const batches = await Batch.findAll({
            include: [
                { model: Course, as: 'course' },
                { model: User, as: 'teacher', attributes: ['id', 'username', 'name', 'email', 'specialization'] },
                { model: User, as: 'students', attributes: ['id'], through: { attributes: [] } },
            ],
            order: [['startDate', 'ASC']],
        });
        res.json(batches);
    } catch (error) {
        console.error('Fetch batches error:', error);
        res.status(500).json({ message: 'Error fetching batches' });
    }
};

export const createBatch = async (req: Request, res: Response) => {
    try {
        const batch = await Batch.create(req.body);
        res.status(201).json(batch);
    } catch (error) {
        console.error('Create batch error:', error);
        res.status(500).json({ message: 'Error creating batch' });
    }
};

export const deleteBatch = async (req: Request, res: Response) => {
    try {
        await Batch.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Batch deleted successfully' });
    } catch (error) {
        console.error('Delete batch error:', error);
        res.status(500).json({ message: 'Error deleting batch' });
    }
};

export const getAllStudents = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;
        const where: any = { role: 'STUDENT' };
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { username: { [Op.like]: `%${search}%` } },
            ];
        }

        const students = await User.findAll({
            where,
            attributes: { exclude: ['password'] },
            include: [{
                model: Batch,
                as: 'enrolledBatches',
                through: { attributes: [] },
                include: [{ model: Course, as: 'course', attributes: ['title'] }],
            }],
            order: [['createdAt', 'DESC']],
        });

        res.json(students);
    } catch (error) {
        console.error('Fetch students error:', error);
        res.status(500).json({ message: 'Server error fetching students' });
    }
};

export const getAllTeachers = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;
        const where: any = { role: 'TEACHER' };
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { username: { [Op.like]: `%${search}%` } },
                { specialization: { [Op.like]: `%${search}%` } },
            ];
        }

        const teachers = await User.findAll({
            where,
            attributes: { exclude: ['password'] },
            include: [
                { model: Course, as: 'courses', required: false },
                { model: Batch, as: 'teacherBatches', required: false },
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json(teachers);
    } catch (error) {
        console.error('Fetch teachers error:', error);
        res.status(500).json({ message: 'Server error fetching teachers' });
    }
};

export const enrollNewStudent = async (req: Request, res: Response) => {
    try {
        const { name, email, phone, password, batchId } = req.body;
        let user = await User.findOne({ where: { email } });

        if (!user) {
            const hashedPassword = await bcrypt.hash(password || 'Student@123', 10);
            user = await User.create({ name, email, phone, password: hashedPassword, role: 'STUDENT', isActive: true });
        }

        if (batchId) {
            const existingEnrollment = await Enrollment.findOne({ where: { studentId: user.id, batchId } });
            if (!existingEnrollment) {
                await Enrollment.create({ studentId: user.id, batchId, enrollmentDate: new Date(), status: 'ACTIVE' });
            }
        }

        res.status(201).json({ message: 'Student enrolled successfully', user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        console.error('Enroll student error:', error);
        res.status(500).json({ message: 'Server error during enrollment' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findByPk(req.params.id as string);
        if (!user) return res.status(404).json({ message: 'User not found' });
        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error during user deletion' });
    }
};
