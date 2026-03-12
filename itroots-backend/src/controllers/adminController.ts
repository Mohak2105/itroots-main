import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import User from '../models/User';
import Batch from '../models/Batch';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import Payment from '../models/Payment';
import Certificate from '../models/Certificate';

export const getAdminDashboard = async (req: Request, res: Response) => {
    try {
        const [students, Faculty, courses, batches, recentStudents, totalRevenue, pendingPayments, certificates, allCourses, allBatchesRaw] = await Promise.all([
            User.count({ where: { role: 'STUDENT' } }),
            User.count({ where: { role: 'Faculty' } }),
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
            Certificate.count(),
            Course.findAll({
                attributes: ['id', 'title', 'category', 'duration', 'status'],
                include: [{ model: User, as: 'instructor', attributes: ['id', 'name'], required: false }],
                order: [['title', 'ASC']],
            }),
            Batch.findAll({
                attributes: ['id', 'name', 'schedule', 'startDate', 'endDate'],
                include: [
                    { model: Course, as: 'course', attributes: ['id', 'title'], required: false },
                    { model: User, as: 'Faculty', attributes: ['id', 'name'], required: false },
                    { model: User, as: 'students', attributes: ['id'], through: { attributes: [] }, required: false },
                ],
                order: [['startDate', 'ASC']],
            }),
        ]);

        const allBatches = allBatchesRaw.map((batch: any) => ({
            id: batch.id,
            name: batch.name,
            schedule: batch.schedule,
            startDate: batch.startDate,
            endDate: batch.endDate,
            studentCount: batch.students?.length || 0,
            course: batch.course ? { id: batch.course.id, title: batch.course.title } : null,
            Faculty: batch.Faculty ? { id: batch.Faculty.id, name: batch.Faculty.name } : null,
        }));

        res.json({
            students,
            Faculty,
            courses,
            batches,
            revenue: Number(totalRevenue || 0),
            pendingPayments,
            certificates,
            recentStudents,
            allCourses,
            allBatches,
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

export const getUserById = async (req: Request, res: Response) => {
    try {
        const user = await User.findByPk(req.params.id as string, {
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Batch,
                    as: 'enrolledBatches',
                    through: { attributes: [] },
                    required: false,
                    include: [
                        { model: Course, as: 'course', attributes: ['id', 'title', 'duration', 'price'] },
                        { model: User, as: 'Faculty', attributes: ['id', 'name', 'email', 'specialization'], required: false },
                    ],
                },
                {
                    model: Payment,
                    as: 'payments',
                    required: false,
                    include: [
                        { model: Course, as: 'course', attributes: ['id', 'title', 'price'], required: false },
                        { model: Batch, as: 'batch', attributes: ['id', 'name'], required: false },
                    ],
                },
                {
                    model: Certificate,
                    as: 'certificates',
                    required: false,
                    include: [
                        { model: Course, as: 'course', attributes: ['id', 'title'], required: false },
                        { model: Batch, as: 'batch', attributes: ['id', 'name'], required: false },
                    ],
                },
            ],
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const totalPaid = Number((user as any).payments?.reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0) || 0);
        const totalCourseFees = Number((user as any).enrolledBatches?.reduce((sum: number, batch: any) => sum + Number(batch.course?.price || 0), 0) || 0);

        return res.json({
            user,
            summary: {
                totalPaid,
                totalCourseFees,
                pendingFees: Math.max(totalCourseFees - totalPaid, 0),
                totalCertificates: (user as any).certificates?.length || 0,
                totalBatches: (user as any).enrolledBatches?.length || 0,
            },
        });
    } catch (error) {
        console.error('Fetch user detail error:', error);
        return res.status(500).json({ message: 'Server error fetching user detail' });
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
        const [totalUsers, totalStudents, totalFaculty, totalBatches, totalRevenue] = await Promise.all([
            User.count(),
            User.count({ where: { role: 'STUDENT' } }),
            User.count({ where: { role: 'Faculty' } }),
            Batch.count(),
            Payment.sum('amount', { where: { status: { [Op.in]: ['PAID', 'PARTIAL'] } } }),
        ]);

        res.json({
            stats: {
                totalUsers,
                totalStudents,
                totalFaculty,
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
                { model: User, as: 'Faculty', attributes: ['id', 'username', 'name', 'email', 'specialization'] },
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
        const { name, courseId, FacultyId, schedule, startDate, endDate } = req.body;
        const batch = await Batch.create({
            name,
            courseId,
            FacultyId: FacultyId || null,
            schedule,
            startDate,
            endDate,
        } as any);
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

export const getAllFaculty = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;
        const where: any = { role: 'Faculty' };
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { username: { [Op.like]: `%${search}%` } },
                { specialization: { [Op.like]: `%${search}%` } },
            ];
        }

        const Faculty = await User.findAll({
            where,
            attributes: { exclude: ['password'] },
            include: [
                { model: Course, as: 'courses', required: false },
                { model: Batch, as: 'FacultyBatches', required: false },
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json(Faculty);
    } catch (error) {
        console.error('Fetch Faculty error:', error);
        res.status(500).json({ message: 'Server error fetching Faculty' });
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

export const impersonateUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findByPk(req.params.id as string);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!user.isActive) {
            return res.status(403).json({ message: 'Cannot impersonate an inactive user' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                phone: user.phone,
                profileImage: user.profileImage,
                role: user.role,
                specialization: user.specialization,
                isActive: user.isActive,
            },
        });
    } catch (error) {
        console.error('Impersonate user error:', error);
        res.status(500).json({ message: 'Server error during impersonation' });
    }
};


