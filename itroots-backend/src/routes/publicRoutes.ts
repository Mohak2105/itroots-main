import express from 'express';
import Course from '../models/Course';
import Lead, { LeadType } from '../models/Lead';

const router = express.Router();

// GET all published public courses
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.findAll({
            where: { isPublished: true },
            order: [['createdAt', 'DESC']]
        });
        res.json(courses);
    } catch (error) {
        console.error('Public courses fetch error:', error);
        res.status(500).json({ message: 'Server error fetching courses' });
    }
});

// GET a single published course by slug
router.get('/courses/:slug', async (req, res) => {
    try {
        const course = await Course.findOne({
            where: {
                slug: req.params.slug,
                isPublished: true
            }
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(course);
    } catch (error) {
        console.error('Public course fetch error:', error);
        res.status(500).json({ message: 'Server error fetching course' });
    }
});

/**
 * LEAD SUBMISSION ENPOINTS
 */

// 1. Contact Form Submission
router.post('/contact', async (req, res) => {
    try {
        const { name, email, phone, message, subject, course } = req.body;
        const lead = await Lead.create({
            type: LeadType.CONTACT,
            name,
            email,
            phone,
            message,
            subject,
            course
        });
        res.status(201).json({ success: true, message: 'Message received. We will contact you soon!', lead });
    } catch (error) {
        console.error('Contact submission error:', error);
        res.status(500).json({ message: 'Failed to submit form' });
    }
});

// 2. Enrollment Form Submission
router.post('/enroll', async (req, res) => {
    try {
        const { name, email, phone, course, message } = req.body;
        const lead = await Lead.create({
            type: LeadType.ENROLLMENT,
            name,
            email,
            phone,
            course,
            message
        });
        res.status(201).json({ success: true, message: 'Enrollment inquiry received. Our team will verify and call you.', lead });
    } catch (error) {
        console.error('Enrollment submission error:', error);
        res.status(500).json({ message: 'Failed to submit enrollment' });
    }
});

// 3. Hire From Us Submission
router.post('/hire', async (req, res) => {
    try {
        const { name, email, phone, company, hiringVolume, experienceLevel, message, roles } = req.body;
        const lead = await Lead.create({
            type: LeadType.HIRE,
            name,
            email,
            phone,
            company,
            hiringVolume,
            experienceLevel,
            message,
            roles
        });
        res.status(201).json({ success: true, message: 'Recruitment inquiry logged. Our corporate relations team will reach out.', lead });
    } catch (error) {
        console.error('Hire inquiry submission error:', error);
        res.status(500).json({ message: 'Failed to submit inquiry' });
    }
});

export default router;
