import express from 'express';
import {
    createCourse,
    updateCourse,
    getAllCourses,
    deleteCourse,
    getAllLeads,
    getAllPlacements,
    createPlacement,
    deletePlacement
} from '../controllers/cmsController';
import { authenticate, authorizeRole } from '../middlewares/auth';

const router = express.Router();

// Protected CMS Routes
// Admins and CMS Managers can access
router.use(authenticate);
router.use(authorizeRole('SUPER_ADMIN', 'CMS_MANAGER'));

// Courses
router.get('/courses', getAllCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Leads (Inquiries)
router.get('/leads', getAllLeads);

// Placements
router.get('/placements', getAllPlacements);
router.post('/placements', createPlacement);
router.delete('/placements/:id', deletePlacement);

export default router;
