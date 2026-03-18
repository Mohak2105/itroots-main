import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import User from '../models/User';

interface AuthenticatedRequest extends Request {
    user?: User;
}

const PROFILE_IMAGE_DIR = path.join(__dirname, '..', '..', 'uploads', 'profile-images');

function buildUserPayload(user: User) {
    return {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        role: user.role,
        specialization: user.specialization,
        isActive: user.isActive,
    };
}

function sanitizeFileName(fileName?: string) {
    const source = (fileName || 'profile-image').toLowerCase();
    const withoutExtension = source.replace(/\.[^.]+$/, '');
    const safe = withoutExtension.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return safe || 'profile-image';
}

function getImageExtension(mimeType: string, fileName?: string) {
    const extensionFromMime = mimeType.split('/')[1]?.toLowerCase() || '';
    if (extensionFromMime === 'jpeg') return 'jpg';
    if (extensionFromMime === 'svg+xml') return 'svg';
    if (extensionFromMime) return extensionFromMime;

    const extensionFromName = (fileName || '').split('.').pop()?.toLowerCase();
    return extensionFromName || 'png';
}

function saveProfileImage(fileData: string, fileName?: string) {
    const match = fileData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

    if (!match) {
        throw new Error('Invalid image payload');
    }

    const [, mimeType, base64Payload] = match;
    const extension = getImageExtension(mimeType, fileName);
    const safeName = sanitizeFileName(fileName);
    const storedFileName = `${Date.now()}-${safeName}.${extension}`;

    fs.mkdirSync(PROFILE_IMAGE_DIR, { recursive: true });
    fs.writeFileSync(path.join(PROFILE_IMAGE_DIR, storedFileName), Buffer.from(base64Payload, 'base64'));

    return `/uploads/profile-images/${storedFileName}`;
}

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role, username, phone, specialization } = req.body;

        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { email },
                    ...(username ? [{ username }] : []),
                ],
            },
        });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            username,
            phone,
            specialization,
            password: hashedPassword,
            role: role || 'STUDENT',
            isActive: true,
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: buildUserPayload(user),
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const rawIdentifier = req.body.identifier || req.body.email || req.body.username;
        const identifier = typeof rawIdentifier === 'string' ? rawIdentifier.trim() : '';
        const normalizedIdentifier = identifier.toLowerCase();
        const password = typeof req.body.password === 'string' ? req.body.password : '';

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Email/username and password are required' });
        }

        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: normalizedIdentifier },
                    { username: identifier },
                    { username: normalizedIdentifier },
                ],
            },
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: buildUserPayload(user),
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    res.json({
        user: buildUserPayload(req.user),
    });
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
        const fileData = typeof req.body.fileData === 'string' ? req.body.fileData : '';
        const fileName = typeof req.body.fileName === 'string' ? req.body.fileName : undefined;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const updates: Partial<{ name: string; phone: string | null; profileImage: string }> = {
            name,
            phone: phone || null,
        };

        if (fileData) {
            updates.profileImage = saveProfileImage(fileData, fileName);
        }

        await req.user.update(updates);

        res.json({
            message: 'Profile updated successfully',
            user: buildUserPayload(req.user),
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Unable to update profile' });
    }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
        const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
        const confirmPassword = typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : '';

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }

        if (confirmPassword && confirmPassword !== newPassword) {
            return res.status(400).json({ message: 'New password confirmation does not match' });
        }

        const isMatch = await bcrypt.compare(currentPassword, req.user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await req.user.update({ password: hashedPassword });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Unable to update password' });
    }
};

