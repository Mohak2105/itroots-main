import { Request, Response } from 'express';
import { Op } from 'sequelize';
const PDFDocument = require('pdfkit');

import User from '../models/User';
import Course from '../models/Course';
import Batch from '../models/Batch';
import Payment from '../models/Payment';
import { generateReceiptNumber } from '../utils/credentials';

const ensureStudent = async (studentId: string) => {
    const student = await User.findByPk(studentId);
    if (!student || student.role !== 'STUDENT') throw new Error('Student not found');
    return student;
};

const resolveCourseId = async (courseId?: string, batchId?: string) => {
    if (batchId) {
        const batch = await Batch.findByPk(batchId);
        if (!batch) throw new Error('Batch not found');
        if (courseId && batch.courseId !== courseId) throw new Error('Selected batch does not belong to the selected course');
        return { courseId: batch.courseId, batchId: batch.id };
    }
    if (courseId) {
        const course = await Course.findByPk(courseId);
        if (!course) throw new Error('Course not found');
    }
    return { courseId, batchId };
};

export const createPayment = async (req: any, res: Response) => {
    try {
        const { studentId, courseId, batchId, amount, installmentNumber, paymentMethod, status, paymentDate, dueDate, notes } = req.body;
        if (!studentId || amount === undefined) return res.status(400).json({ message: 'studentId and amount are required' });

        await ensureStudent(studentId as string);
        const resolved = await resolveCourseId(courseId, batchId);

        const payment = await Payment.create({
            studentId,
            courseId: resolved.courseId || undefined,
            batchId: resolved.batchId || undefined,
            amount,
            installmentNumber: installmentNumber || 1,
            paymentMethod: paymentMethod || 'ONLINE',
            status: status || 'PAID',
            paymentDate: paymentDate || new Date(),
            dueDate: dueDate || undefined,
            notes,
            receiptNumber: generateReceiptNumber(),
            createdBy: req.user.id,
        });

        const created = await Payment.findByPk(payment.id, {
            include: [
                { model: User, as: 'student', attributes: ['id', 'username', 'name', 'email'] },
                { model: Course, as: 'course', attributes: ['id', 'title', 'price'] },
                { model: Batch, as: 'batch', attributes: ['id', 'name'] },
            ],
        });

        res.status(201).json({ message: 'Payment recorded successfully', payment: created });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Server error during payment creation' });
    }
};

export const getPayments = async (req: Request, res: Response) => {
    try {
        const where: any = {};
        if (req.query.studentId) where.studentId = req.query.studentId;
        if (req.query.status) where.status = req.query.status;
        if (req.query.batchId) where.batchId = req.query.batchId;

        const payments = await Payment.findAll({
            where,
            include: [
                { model: User, as: 'student', attributes: ['id', 'username', 'name', 'email'] },
                { model: Course, as: 'course', attributes: ['id', 'title', 'price'] },
                { model: Batch, as: 'batch', attributes: ['id', 'name'] },
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
            ],
            order: [['paymentDate', 'DESC'], ['createdAt', 'DESC']],
        });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching payments' });
    }
};

export const getPaymentAnalytics = async (req: Request, res: Response) => {
    try {
        const [totalRevenue, pendingCollection, paidCount, pendingCount] = await Promise.all([
            Payment.sum('amount', { where: { status: { [Op.in]: ['PAID', 'PARTIAL'] } } }),
            Payment.sum('amount', { where: { status: 'PENDING' } }),
            Payment.count({ where: { status: { [Op.in]: ['PAID', 'PARTIAL'] } } }),
            Payment.count({ where: { status: 'PENDING' } }),
        ]);

        res.json({ totalRevenue: Number(totalRevenue || 0), pendingCollection: Number(pendingCollection || 0), paidCount, pendingCount });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching payment analytics' });
    }
};

export const downloadReceipt = async (req: Request, res: Response) => {
    try {
        const paymentId = req.params.id as string;
        const payment = await Payment.findByPk(paymentId, {
            include: [
                { model: User, as: 'student', attributes: ['name', 'email', 'phone', 'username'] },
                { model: Course, as: 'course', attributes: ['title'] },
                { model: Batch, as: 'batch', attributes: ['name'] },
                { model: User, as: 'creator', attributes: ['name'] },
            ],
        });
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt-${payment.receiptNumber}.pdf`);

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);
        doc.fontSize(20).text('ITRoots Fee Receipt', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Receipt Number: ${payment.receiptNumber}`);
        doc.text(`Payment Date: ${new Date(payment.paymentDate).toLocaleString()}`);
        doc.text(`Student: ${(payment as any).student?.name || ''}`);
        doc.text(`Username: ${(payment as any).student?.username || '-'}`);
        doc.text(`Email: ${(payment as any).student?.email || ''}`);
        doc.text(`Phone: ${(payment as any).student?.phone || '-'}`);
        doc.moveDown();
        doc.text(`Course: ${(payment as any).course?.title || '-'}`);
        doc.text(`Batch: ${(payment as any).batch?.name || '-'}`);
        doc.text(`Installment Number: ${payment.installmentNumber}`);
        doc.text(`Payment Method: ${payment.paymentMethod}`);
        doc.text(`Status: ${payment.status}`);
        doc.text(`Amount: ${payment.currency} ${Number(payment.amount).toFixed(2)}`);
        if (payment.notes) doc.text(`Notes: ${payment.notes}`);
        doc.moveDown();
        doc.text(`Recorded By: ${(payment as any).creator?.name || 'System'}`);
        doc.end();
    } catch (error) {
        res.status(500).json({ message: 'Server error generating receipt' });
    }
};
