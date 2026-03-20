import slugify from 'slugify';
import User from '../models/User';

export const generateRandomPassword = (length = 10) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const generateReceiptNumber = () => {
    return `RCT-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
};

export const generateUsername = async (name: string, email: string) => {
    const baseName = slugify(name || email.split('@')[0], { lower: true, strict: true }) || 'user';
    let candidate = baseName;
    let counter = 1;

    while (await User.findOne({ where: { username: candidate } })) {
        candidate = `${baseName}${counter}`;
        counter += 1;
    }

    return candidate;
};
