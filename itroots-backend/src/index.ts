import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { connectDB } from './config/database';

import authRoutes from './routes/authRoutes';
import cmsRoutes from './routes/cmsRoutes';
import adminRoutes from './routes/adminRoutes';
import teacherRoutes from './routes/teacherRoutes';
import studentRoutes from './routes/studentRoutes';
import publicRoutes from './routes/publicRoutes';
import { verifyMailerConnection } from './services/mailer';
import { ensureTestDueAtColumn, ensureTestResultAnalyticsColumns } from './utils/testSchema';
import { ensureLiveClassJitsiColumns } from './utils/liveClassSchema';

import './models/User';
import './models/Course';
import './models/Lead';
import './models/Placement';
import './models/Batch';
import './models/Enrollment';
import './models/BatchContent';
import './models/Test';
import './models/TestResult';
import './models/Attendance';
import './models/Announcement';
import './models/Payment';
import './models/Notification';
import './models/NotificationRecipient';
import './models/LiveClass';
import './models/Certificate';
import './models/AssignmentSubmission';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the ITRoots Learning Platform API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/v1/auth',
            cms: '/api/v1/cms',
            admin: '/api/v1/admin',
            teacher: '/api/v1/teacher',
            Faculty: '/api/v1/Faculty',
            student: '/api/v1/student',
            public: '/api/v1/public',
        },
        systemTime: new Date().toISOString(),
    });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/cms', cmsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/teacher', teacherRoutes);
app.use('/api/v1/Faculty', teacherRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/public', publicRoutes);

const startServer = async () => {
    try {
        await connectDB();
        console.log('Database connection ready');
        await ensureTestDueAtColumn();
        await ensureTestResultAnalyticsColumns();
        await ensureLiveClassJitsiColumns();
        await verifyMailerConnection();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Final server startup error:', error);
    }
};

startServer();
