import bcrypt from 'bcryptjs';
import User from './models/User';
import { connectDB } from './config/database';

const createAdmin = async () => {
    await connectDB();

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const hashedFaculty = await bcrypt.hash('Faculty123', 10);
    const hashedStudent = await bcrypt.hash('student123', 10);

    try {
        await User.findOrCreate({
            where: { email: 'admin@itroots.com' },
            defaults: { username: 'admin', name: 'Super Admin', email: 'admin@itroots.com', password: hashedPassword, role: 'SUPER_ADMIN', isActive: true }
        });
        await User.findOrCreate({
            where: { email: 'Faculty@itroots.com' },
            defaults: { username: 'Faculty', name: 'Demo Faculty', email: 'Faculty@itroots.com', password: hashedFaculty, role: 'Faculty', specialization: 'Full Stack Development', isActive: true }
        });
        await User.findOrCreate({
            where: { email: 'student@itroots.com' },
            defaults: { username: 'student', name: 'Demo Student', email: 'student@itroots.com', password: hashedStudent, role: 'STUDENT', isActive: true }
        });
        await User.findOrCreate({
            where: { email: 'cms@itroots.com' },
            defaults: { username: 'cmsmanager', name: 'Demo CMS', email: 'cms@itroots.com', password: hashedPassword, role: 'CMS_MANAGER', isActive: true }
        });
        console.log('? All demo users seeded successfully!');
    } catch (err) {
        console.error('? Error seeding users:', err);
    } finally {
        process.exit();
    }
};

createAdmin();
