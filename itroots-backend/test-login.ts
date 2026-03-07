import { connectDB } from './src/config/database';
import User from './src/models/User';
import bcrypt from 'bcryptjs';
import fs from 'fs';

async function test() {
    try {
        await connectDB();
        const user = await User.findOne({ where: { email: 'admin@itroots.com' } });

        let out = {
            found: !!user,
            passDirect: user ? (user as any).password : null,
            passDataValues: user ? (user as any).dataValues.password : null,
        };
        fs.writeFileSync('test-output.json', JSON.stringify(out, null, 2));
    } catch (e: any) {
        fs.writeFileSync('test-output.json', JSON.stringify({ error: e.message || String(e) }, null, 2));
    } finally {
        process.exit();
    }
}

test();
