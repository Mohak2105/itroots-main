import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

let userTableReady: boolean | null = null;
let userColumnsPromise: Promise<Set<string>> | null = null;

const describeUserColumns = async () => {
    try {
        const tableDefinition = await sequelize.getQueryInterface().describeTable('users');
        return new Set(Object.keys(tableDefinition));
    } catch {
        return new Set<string>();
    }
};

const getUserColumns = async () => {
    if (!userColumnsPromise) {
        userColumnsPromise = describeUserColumns();
    }

    return userColumnsPromise;
};

export const isUserTableReady = async () => {
    if (userTableReady !== null) return userTableReady;

    const columns = await getUserColumns();
    userTableReady = columns.size > 0;
    return userTableReady;
};

export const ensureUserProfileImageColumn = async () => {
    const tableReady = await isUserTableReady();
    if (!tableReady) return new Set<string>();

    const queryInterface = sequelize.getQueryInterface();
    const availableColumns = await getUserColumns();
    const nextColumns = new Set(availableColumns);

    if (!availableColumns.has('profileImage')) {
        await queryInterface.addColumn('users', 'profileImage', {
            type: DataTypes.STRING,
            allowNull: true,
        });
        nextColumns.add('profileImage');
    }

    userColumnsPromise = Promise.resolve(nextColumns);
    return nextColumns;
};
