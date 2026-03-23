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

    if (!availableColumns.has('firstName')) {
        await queryInterface.addColumn('users', 'firstName', {
            type: DataTypes.STRING,
            allowNull: true,
        });
        nextColumns.add('firstName');
    }

    if (!availableColumns.has('middleName')) {
        await queryInterface.addColumn('users', 'middleName', {
            type: DataTypes.STRING,
            allowNull: true,
        });
        nextColumns.add('middleName');
    }

    if (!availableColumns.has('lastName')) {
        await queryInterface.addColumn('users', 'lastName', {
            type: DataTypes.STRING,
            allowNull: true,
        });
        nextColumns.add('lastName');
    }

    userColumnsPromise = Promise.resolve(nextColumns);
    return nextColumns;
};
