import { Request, Response } from 'express';
import Attendance from '../models/Attendance';
import Batch from '../models/Batch';
import User from '../models/User';
import Enrollment from '../models/Enrollment';

export const markAttendance = async (req: Request, res: Response) => {
    try {
        const { batchId, date, records } = req.body;
        // records: [{ studentId: 'uuid', status: 'PRESENT', remarks: '' }]
        const FacultyId = (req as any).user.id;

        // Verify Faculty owns the batch
        const batch = await Batch.findOne({ where: { id: batchId, FacultyId } });
        if (!batch && (req as any).user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Not authorized for this batch' });
        }

        const attendancePromises = records.map((record: any) =>
            Attendance.upsert({
                studentId: record.studentId,
                batchId,
                date,
                status: record.status,
                remarks: record.remarks
            })
        );

        await Promise.all(attendancePromises);

        res.json({ success: true, message: 'Attendance recorded successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBatchAttendance = async (req: Request, res: Response) => {
    try {
        const { batchId } = req.params;
        const { date } = req.query; // optional filter by date

        const whereClause: any = { batchId };
        if (date) whereClause.date = date;

        const attendance = await Attendance.findAll({
            where: whereClause,
            include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email'] }],
            order: [['date', 'DESC'], [{ model: User, as: 'student' }, 'name', 'ASC']]
        });

        res.json({ success: true, data: attendance });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStudentAttendance = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user.id;

        const attendance = await Attendance.findAll({
            where: { studentId },
            include: [{
                model: Batch,
                as: 'batch',
                attributes: ['id', 'name', 'courseId'],
            }],
            order: [['date', 'DESC']]
        });

        // Group by batch for easier frontend consumption
        const groupedByBatch = attendance.reduce((acc: any, record: any) => {
            const batchName = record.batch?.name || 'Unknown Batch';
            if (!acc[batchName]) {
                acc[batchName] = { total: 0, present: 0, absent: 0, late: 0, records: [] };
            }
            acc[batchName].total += 1;
            acc[batchName][record.status.toLowerCase()] += 1;
            acc[batchName].records.push(record);
            return acc;
        }, {});

        res.json({ success: true, data: groupedByBatch, raw: attendance });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
