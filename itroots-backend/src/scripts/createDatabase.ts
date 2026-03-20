import { connectDB, syncDatabase } from '../config/database';

const run = async () => {
    await connectDB();
    await syncDatabase();
    console.log('Database bootstrap completed.');
};

run()
    .catch((error) => {
        console.error('Database bootstrap failed:', error);
        process.exit(1);
    })
    .finally(() => {
        process.exit();
    });
