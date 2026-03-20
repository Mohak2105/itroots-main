import express from 'express';
import {
    getStudentDashboard,
    getAvailableBatches,
    selfEnroll,
    getMyLearning,
    getBatchResources,
    getStudentAssignments,
    submitAssignment,
    getMyTests,
    submitExamResult,
    getMyCertificates,
    downloadMyCertificate,
    getStudentPlacements,
} from '../controllers/studentController';
import { getStudentLiveClasses, getStudentLiveClassById } from '../controllers/liveClassController';
import { getStudentAttendance } from '../controllers/attendanceController';
import { getStudentAnnouncements } from '../controllers/announcementController';
import { getMyNotifications, markNotificationAsRead } from '../controllers/userNotificationController';
import { authenticate, authorizeRole } from '../middlewares/auth';

const router = express.Router();

router.use(authenticate);
router.use(authorizeRole('STUDENT'));

router.get('/dashboard', getStudentDashboard);
router.get('/available-batches', getAvailableBatches);
router.post('/self-enroll', selfEnroll);
router.get('/my-learning', getMyLearning);
router.get('/batch-resources', getBatchResources);
router.get('/batch-resources/:batchId', getBatchResources);
router.get('/assignments', getStudentAssignments);
router.post('/assignments/:assignmentId/submit', submitAssignment);
router.get('/tests', getMyTests);
router.post('/submit-exam', submitExamResult);

router.get('/attendance', getStudentAttendance);
router.get('/announcements', getStudentAnnouncements);
router.get('/live-classes', getStudentLiveClasses);
router.get('/live-classes/:liveClassId', getStudentLiveClassById);
router.get('/notifications', getMyNotifications);
router.patch('/notifications/:notificationId/read', markNotificationAsRead);
router.get('/placements', getStudentPlacements);
router.get('/certificates', getMyCertificates);
router.get('/certificates/:id/download', downloadMyCertificate);

export default router;
