import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import User from '../models/User';
import Batch from '../models/Batch';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import Payment from '../models/Payment';
import { generateRandomPassword, generateUsername } from '../utils/credentials';
import { sendWelcomeEmail } from '../services/mailer';

const sanitizeUser = (user: any) => ({
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
});

const resolveCourseAndBatch = async (courseId?: string, batchId?: string) => {
    let resolvedCourseId = courseId;
    let batch: any = null;

    if (batchId) {
        batch = await Batch.findByPk(batchId);
        if (!batch) throw new Error('Batch not found');
        if (resolvedCourseId && batch.courseId !== resolvedCourseId) throw new Error('Selected batch does not belong to the selected course');
        resolvedCourseId = batch.courseId;
    }

    if (resolvedCourseId) {
        const course = await Course.findByPk(resolvedCourseId);
        if (!course) throw new Error('Course not found');
    }

    return { resolvedCourseId, batch };
};

const assignStudentToBatch = async (studentId: string, batchId?: string, transaction?: any) => {
    if (!batchId) return null;
    const [enrollment] = await Enrollment.findOrCreate({
        where: { studentId, batchId },
        defaults: { studentId, batchId, enrollmentDate: new Date(), status: 'ACTIVE' },
        transaction,
    });
    return enrollment;
};

const ensureRole = async (userId: string, role: 'STUDENT' | 'TEACHER') => {
    const user = await User.findByPk(userId);
    if (!user || user.role !== role) throw new Error(role === 'STUDENT' ? 'Student not found' : 'Teacher not found');
    return user;
};

const assignTeacherToResources = async (
    teacherId: string,
    assignedCourseId?: string,
    assignedBatchId?: string,
    transaction?: any
) => {
    let resolvedCourseId = assignedCourseId;
    let batch: any = null;

    if (assignedBatchId) {
        batch = await Batch.findByPk(assignedBatchId, transaction ? { transaction } : undefined);
        if (!batch) throw new Error('Assigned batch not found');
        if (resolvedCourseId && batch.courseId !== resolvedCourseId) {
            throw new Error('Assigned batch does not belong to the selected course');
        }
        resolvedCourseId = batch.courseId;
    }

    let course: any = null;
    if (resolvedCourseId) {
        course = await Course.findByPk(resolvedCourseId, transaction ? { transaction } : undefined);
        if (!course) throw new Error('Assigned course not found');
        course.instructorId = teacherId;
        await course.save(transaction ? { transaction } : undefined);
    }

    if (batch) {
        batch.teacherId = teacherId;
        await batch.save(transaction ? { transaction } : undefined);
    }

    return {
        assignedCourseId: resolvedCourseId || null,
        assignedBatchId: batch?.id || null,
    };
};

const getStudentFeeSummary = async (studentId: string) => {
    const enrollments = await Enrollment.findAll({
        where: { studentId },
        include: [{ model: Batch, as: 'batch', include: [{ model: Course, as: 'course' }] }],
    });

    const totalCourseFees = enrollments.reduce((sum: number, enrollment: any) => sum + Number(enrollment.batch?.course?.price || 0), 0);
    const totalPaid = Number(await Payment.sum('amount', { where: { studentId, status: { [Op.in]: ['PAID', 'PARTIAL'] } } }) || 0);

    return { totalCourseFees, totalPaid, pendingFees: Math.max(totalCourseFees - totalPaid, 0) };
};

export const createStudent = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    try {
        const { name, email, phone, courseId, batchId } = req.body;
        if (!name || !email || !phone) {
            await transaction.rollback();
            return res.status(400).json({ message: 'name, email and phone are required' });
        }

        const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { phone }] }, transaction });
        if (existingUser) {
            await transaction.rollback();
            return res.status(400).json({ message: 'A student with this email or phone already exists' });
        }

        const username = await generateUsername(name, email);
        const plainPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        const { resolvedCourseId, batch } = await resolveCourseAndBatch(courseId, batchId);

        const student = await User.create({ username, name, email, phone, password: hashedPassword, role: 'STUDENT', isActive: true }, { transaction });
        await assignStudentToBatch(student.id, batch?.id, transaction);
        await transaction.commit();

        await sendWelcomeEmail({ to: email, name, username, password: plainPassword, role: 'STUDENT' });

        res.status(201).json({
            message: 'Student created successfully',
            student: sanitizeUser(student),
            credentials: { username, password: plainPassword, loginWith: [username, email] },
            assignedCourseId: resolvedCourseId || null,
            assignedBatchId: batch?.id || null,
        });
    } catch (error: any) {
        await transaction.rollback();
        res.status(500).json({ message: error.message || 'Server error during student creation' });
    }
};

export const assignStudentBatch = async (req: Request, res: Response) => {
    try {
        const studentId = req.params.id as string;
        const student = await ensureRole(studentId, 'STUDENT');
        const { courseId, batchId } = req.body;
        const { resolvedCourseId, batch } = await resolveCourseAndBatch(courseId, batchId);
        await assignStudentToBatch(student.id, batch?.id);

        res.json({ message: 'Student assignment updated successfully', studentId: student.id, assignedCourseId: resolvedCourseId || null, assignedBatchId: batch?.id || null });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Server error during student assignment' });
    }
};

export const createTeacher = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    try {
        const { name, email, phone, specialization, assignedCourseId, assignedBatchId } = req.body;
        if (!name || !email || !phone || !specialization) {
            await transaction.rollback();
            return res.status(400).json({ message: 'name, email, phone and specialization are required' });
        }

        const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { phone }] }, transaction });
        if (existingUser) {
            await transaction.rollback();
            return res.status(400).json({ message: 'A teacher with this email or phone already exists' });
        }

        const username = await generateUsername(name, email);
        const plainPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const teacher = await User.create({ username, name, email, phone, password: hashedPassword, role: 'TEACHER', specialization, isActive: true }, { transaction });
        const assignment = await assignTeacherToResources(teacher.id, assignedCourseId, assignedBatchId, transaction);
        await transaction.commit();

        await sendWelcomeEmail({ to: email, name, username, password: plainPassword, role: 'TEACHER' });

        res.status(201).json({
            message: 'Teacher created successfully',
            teacher: sanitizeUser(teacher),
            credentials: { username, password: plainPassword, loginWith: [username, email] },
            assignedCourseId: assignment.assignedCourseId,
            assignedBatchId: assignment.assignedBatchId,
        });
    } catch (error: any) {
        await transaction.rollback();
        res.status(500).json({ message: error.message || 'Server error during teacher creation' });
    }
};

export const assignTeacherResources = async (req: Request, res: Response) => {
    try {
        const teacherId = req.params.id as string;
        await ensureRole(teacherId, 'TEACHER');
        const { assignedCourseId, assignedBatchId } = req.body;
        const assignment = await assignTeacherToResources(teacherId, assignedCourseId, assignedBatchId);

        res.json({
            message: 'Teacher assignments updated successfully',
            assignedCourseId: assignment.assignedCourseId,
            assignedBatchId: assignment.assignedBatchId,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Server error during teacher assignment' });
    }
};

export const getStudentPayments = async (req: Request, res: Response) => {
    try {
        const studentId = req.params.id as string;
        await ensureRole(studentId, 'STUDENT');
        const [payments, feeSummary] = await Promise.all([
            Payment.findAll({
                where: { studentId },
                include: [
                    { model: Course, as: 'course', attributes: ['id', 'title', 'price'] },
                    { model: Batch, as: 'batch', attributes: ['id', 'name'] },
                ],
                order: [['paymentDate', 'DESC']],
            }),
            getStudentFeeSummary(studentId),
        ]);

        res.json({ feeSummary, payments });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Server error fetching student payments' });
    }
};
