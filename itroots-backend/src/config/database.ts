import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const resolveDialect = () => {
    const explicitDialect = process.env.DB_DIALECT?.trim().toLowerCase();
    if (explicitDialect === 'mysql' || explicitDialect === 'postgres') {
        return explicitDialect;
    }

    if (databaseUrl) {
        try {
            const parsed = new URL(databaseUrl);
            const protocol = parsed.protocol.replace(':', '').toLowerCase();

            if (protocol === 'postgres' || protocol === 'postgresql') {
                return 'postgres';
            }

            if (protocol === 'mysql') {
                return 'mysql';
            }
        } catch {
            // Fall back to mysql for backward compatibility if DATABASE_URL is malformed.
        }
    }

    return 'mysql';
};

const dialect = resolveDialect() as 'mysql' | 'postgres';
const defaultPort = dialect === 'mysql' ? '3306' : '5432';
const defaultDatabaseName = process.env.DB_NAME || 'itroots_db';

const resolveDatabaseName = () => {
    if (databaseUrl) {
        try {
            const parsed = new URL(databaseUrl);
            const pathname = parsed.pathname.replace(/^\/+/, '');
            return pathname || defaultDatabaseName;
        } catch {
            return defaultDatabaseName;
        }
    }

    return defaultDatabaseName;
};

const resolvedDatabaseName = resolveDatabaseName();

const sequelize = databaseUrl
    ? new Sequelize(databaseUrl, {
        dialect,
        logging: false,
    })
    : new Sequelize(
        resolvedDatabaseName,
        process.env.DB_USER || 'root',
        process.env.DB_PASSWORD || '',
        {
            host: process.env.DB_HOST || 'localhost',
            dialect,
            port: parseInt(process.env.DB_PORT || defaultPort, 10),
            logging: false,
        }
    );

const createPostgresDatabaseIfNeeded = async () => {
    if (dialect !== 'postgres') {
        return;
    }

    const dbName = resolvedDatabaseName;
    if (!dbName) {
        return;
    }

    const { Client } = require('pg') as { Client: any };
    const maintenanceDatabase = process.env.POSTGRES_MAINTENANCE_DB || 'postgres';

    let clientConfig: Record<string, unknown>;

    if (databaseUrl) {
        const parsed = new URL(databaseUrl);
        clientConfig = {
            host: parsed.hostname,
            port: parsed.port ? Number(parsed.port) : Number(defaultPort),
            user: decodeURIComponent(parsed.username),
            password: decodeURIComponent(parsed.password),
            database: maintenanceDatabase,
        };
    } else {
        clientConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || defaultPort, 10),
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
            database: maintenanceDatabase,
        };
    }

    const client = new Client(clientConfig);

    try {
        await client.connect();
        const existingDb = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);

        if (existingDb.rowCount === 0) {
            const safeDbName = dbName.replace(/"/g, '""');
            await client.query(`CREATE DATABASE "${safeDbName}"`);
            console.log(`PostgreSQL database "${dbName}" created successfully.`);
        }
    } finally {
        await client.end().catch(() => undefined);
    }
};

export const connectDB = async () => {
    try {
        await createPostgresDatabaseIfNeeded();
        await sequelize.authenticate();
        console.log(`${dialect.toUpperCase()} connection has been established successfully.`);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

export const syncDatabase = async () => {
    await sequelize.sync();
    console.log('Database tables are synchronized.');
};

export default sequelize;
