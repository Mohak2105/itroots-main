import express from 'express';
import {
    getFacultyDashboard,
    getMyBatches,
    getBatchData,
    addBatchContent,
    updateBatchContent,
    deleteBatchContent,
    createTest,
    updateTest,
    deleteTest,
    getFacultyTests,
    getTestResults,
    getFacultyAssignments,
    getFacultyAssignmentDetail,
    reviewAssignmentSubmission,
    createFacultyNotification,
    getFacultySentNotifications,
} from '../controllers/teacherController';
import {
    getFacultyLiveClasses,
    getFacultyLiveClassById,
    createLiveClass,
    updateLiveClass,
    cancelLiveClass,
    completeLiveClass,
    getFacultyLiveClassZoomSignature,
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
router.patch('/batch-content/:contentId', updateBatchContent);
router.delete('/batch-content/:contentId', deleteBatchContent);
router.get('/tests', getFacultyTests);
router.post('/tests', createTest);
router.put('/tests/:testId', updateTest);
router.delete('/tests/:testId', deleteTest);
router.get('/test-results/:testId', getTestResults);
router.get('/assignments', getFacultyAssignments);
router.get('/assignments/:assignmentId', getFacultyAssignmentDetail);
router.patch('/assignments/:submissionId/review', reviewAssignmentSubmission);

router.post('/attendance', markAttendance);
router.get('/attendance/:batchId', getBatchAttendance);
router.post('/announcements', createAnnouncement);
router.get('/announcements/:batchId', getBatchAnnouncements);
router.get('/live-classes', getFacultyLiveClasses);
router.get('/live-classes/:liveClassId', getFacultyLiveClassById);
router.post('/live-classes/:liveClassId/zoom-signature', getFacultyLiveClassZoomSignature);
router.post('/live-classes', createLiveClass);
router.put('/live-classes/:liveClassId', updateLiveClass);
router.patch('/live-classes/:liveClassId/cancel', cancelLiveClass);
router.patch('/live-classes/:liveClassId/complete', completeLiveClass);
router.get('/notifications', getMyNotifications);
router.get('/notifications/sent', getFacultySentNotifications);
router.post('/notifications', createFacultyNotification);
router.patch('/notifications/:notificationId/read', markNotificationAsRead);

export default router;
