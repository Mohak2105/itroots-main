import express from 'express';
import { register, login, me, updateProfile, changePassword } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

export default router;
