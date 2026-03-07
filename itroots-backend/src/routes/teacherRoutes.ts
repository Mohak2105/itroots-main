import express from 'express';
import {
    getTeacherDashboard,
    getMyBatches,
    getBatchData,
    addBatchContent,
    createTest,
    getTestResults
} from '../controllers/teacherController';
import {
    getTeacherLiveClasses,
    createLiveClass,
    updateLiveClass,
    cancelLiveClass,
} from '../controllers/liveClassController';
import { markAttendance, getBatchAttendance } from '../controllers/attendanceController';
import { createAnnouncement, getBatchAnnouncements } from '../controllers/announcementController';
import { getMyNotifications, markNotificationAsRead } from '../controllers/userNotificationController';
import { authenticate, authorizeRole } from '../middlewares/auth';

const router = express.Router();

router.use(authenticate);
router.use(authorizeRole('TEACHER'));

router.get('/dashboard', getTeacherDashboard);
router.get('/my-batches', getMyBatches);
router.get('/batch-data/:batchId', getBatchData);
router.post('/batch-content', addBatchContent);
router.post('/tests', createTest);
router.get('/test-results/:testId', getTestResults);

router.post('/attendance', markAttendance);
router.get('/attendance/:batchId', getBatchAttendance);
router.post('/announcements', createAnnouncement);
router.get('/announcements/:batchId', getBatchAnnouncements);
router.get('/live-classes', getTeacherLiveClasses);
router.post('/live-classes', createLiveClass);
router.put('/live-classes/:liveClassId', updateLiveClass);
router.patch('/live-classes/:liveClassId/cancel', cancelLiveClass);
router.get('/notifications', getMyNotifications);
router.patch('/notifications/:notificationId/read', markNotificationAsRead);

export default router;
