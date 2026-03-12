import express from 'express';
import {
    getFacultyDashboard,
    getMyBatches,
    getBatchData,
    addBatchContent,
    createTest,
    getTestResults,
    getFacultyAssignments,
    reviewAssignmentSubmission,
} from '../controllers/teacherController';
import {
    getFacultyLiveClasses,
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
router.use(authorizeRole('Faculty', 'TEACHER'));

router.get('/dashboard', getFacultyDashboard);
router.get('/my-batches', getMyBatches);
router.get('/batch-data/:batchId', getBatchData);
router.post('/batch-content', addBatchContent);
router.post('/tests', createTest);
router.get('/test-results/:testId', getTestResults);
router.get('/assignments', getFacultyAssignments);
router.patch('/assignments/:submissionId/review', reviewAssignmentSubmission);

router.post('/attendance', markAttendance);
router.get('/attendance/:batchId', getBatchAttendance);
router.post('/announcements', createAnnouncement);
router.get('/announcements/:batchId', getBatchAnnouncements);
router.get('/live-classes', getFacultyLiveClasses);
router.post('/live-classes', createLiveClass);
router.put('/live-classes/:liveClassId', updateLiveClass);
router.patch('/live-classes/:liveClassId/cancel', cancelLiveClass);
router.get('/notifications', getMyNotifications);
router.patch('/notifications/:notificationId/read', markNotificationAsRead);

export default router;