import express from 'express';
import {
    getAllUsers,
    getUserById,
    updateUser,
    getSystemStats,
    getAllBatches,
    deleteBatch,
    getAllStudents,
    enrollNewStudent,
    deleteUser,
    getAllFaculty,
    getAdminDashboard,
    impersonateUser
} from '../controllers/adminController';
import {
    createStudent,
    assignStudentBatch,
    createFaculty,
    assignFacultyResources,
    getStudentPayments,
    sendUserWelcomeMail,
} from '../controllers/adminPeopleController';
import {
    getAllCourses,
    createCourse,
    createBatch,
    updateCourse,
    deleteCourse,
    updateBatch,
} from '../controllers/adminAcademicController';
import {
    createPayment,
    getPayments,
    getPaymentAnalytics,
    downloadReceipt,
} from '../controllers/adminFinanceController';
import {
    createAdminAnnouncement,
    getAnnouncements,
    createTargetedNotification,
    getNotifications,
    deleteNotification,
    sendPlacementNotification,
} from '../controllers/adminNotificationController';
import {
    getCertificates,
    createCertificate,
    downloadCertificate,
} from '../controllers/adminCertificateController';
import { authenticate, authorizeRole } from '../middlewares/auth';

const router = express.Router();

router.use(authenticate);
router.use(authorizeRole('SUPER_ADMIN'));

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.post('/users/:id/send-welcome-email', sendUserWelcomeMail);
router.post('/users/:id/impersonate', impersonateUser);
router.delete('/users/:id', deleteUser);

router.get('/system-stats', getSystemStats);

router.get('/courses', getAllCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

router.get('/batches', getAllBatches);
router.post('/batches', createBatch);
router.put('/batches/:id', updateBatch);
router.delete('/batches/:id', deleteBatch);

router.get('/students', getAllStudents);
router.post('/students', createStudent);
router.post('/students/enroll', enrollNewStudent);
router.put('/students/:id/assignments', assignStudentBatch);
router.get('/students/:id/payments', getStudentPayments);

router.get('/Faculty', getAllFaculty);
router.post('/Faculty', createFaculty);
router.put('/Faculty/:id/assignments', assignFacultyResources);

router.get('/payments', getPayments);
router.post('/payments', createPayment);
router.get('/payments/analytics', getPaymentAnalytics);
router.get('/payments/:id/receipt', downloadReceipt);

router.get('/certificates', getCertificates);
router.post('/certificates', createCertificate);
router.get('/certificates/:id/download', downloadCertificate);

router.get('/announcements', getAnnouncements);
router.post('/announcements', createAdminAnnouncement);
router.get('/notifications', getNotifications);
router.post('/notifications', createTargetedNotification);
router.delete('/notifications/:id', deleteNotification);
router.post('/placements/:placementId/send', sendPlacementNotification);

export default router;
