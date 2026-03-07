import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const dialect = (process.env.DB_DIALECT || 'mysql') as 'mysql' | 'postgres';
const defaultPort = dialect === 'mysql' ? '3306' : '5432';

const sequelize = databaseUrl
    ? new Sequelize(databaseUrl, {
        dialect,
        logging: false,
    })
    : new Sequelize(
        process.env.DB_NAME || 'itroots_db',
        process.env.DB_USER || 'root',
        process.env.DB_PASSWORD || '',
        {
            host: process.env.DB_HOST || 'localhost',
            dialect,
            port: parseInt(process.env.DB_PORT || defaultPort, 10),
            logging: false,
        }
    );

export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`${dialect.toUpperCase()} connection has been established successfully.`);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

export default sequelize;
