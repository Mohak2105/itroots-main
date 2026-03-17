import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

let testTableReady: boolean | null = null;
let testColumnsPromise: Promise<Set<string>> | null = null;
let testResultTableReady: boolean | null = null;
let testResultColumnsPromise: Promise<Set<string>> | null = null;

const describeColumns = async (tableName: string) => {
    try {
        const tableDefinition = await sequelize.getQueryInterface().describeTable(tableName);
        return new Set(Object.keys(tableDefinition));
    } catch {
        return new Set<string>();
    }
};

const getTestColumns = async () => {
    if (!testColumnsPromise) {
        testColumnsPromise = describeColumns('tests');
    }

    return testColumnsPromise;
};

const getTestResultColumns = async () => {
    if (!testResultColumnsPromise) {
        testResultColumnsPromise = describeColumns('test_results');
    }

    return testResultColumnsPromise;
};

export const isTestTableReady = async () => {
    if (testTableReady !== null) return testTableReady;

    const columns = await getTestColumns();
    testTableReady = columns.size > 0;
    return testTableReady;
};

export const ensureTestDueAtColumn = async () => {
    const tableReady = await isTestTableReady();
    if (!tableReady) return new Set<string>();

    const queryInterface = sequelize.getQueryInterface();
    const availableColumns = await getTestColumns();
    const nextColumns = new Set(availableColumns);

    if (!availableColumns.has('dueAt')) {
        await queryInterface.addColumn('tests', 'dueAt', {
            type: DataTypes.DATE,
            allowNull: true,
        });
        nextColumns.add('dueAt');
    }

    testColumnsPromise = Promise.resolve(nextColumns);
    return nextColumns;
};

export const ensureTestResultAnalyticsColumns = async () => {
    if (testResultTableReady === null) {
        const columns = await getTestResultColumns();
        testResultTableReady = columns.size > 0;
    }

    if (!testResultTableReady) return new Set<string>();

    const queryInterface = sequelize.getQueryInterface();
    const availableColumns = await getTestResultColumns();
    const nextColumns = new Set(availableColumns);

    const ensureColumn = async (columnName: string, definition: Parameters<typeof queryInterface.addColumn>[2]) => {
        if (nextColumns.has(columnName)) return;
        await queryInterface.addColumn('test_results', columnName, definition);
        nextColumns.add(columnName);
    };

    await ensureColumn('correctAnswers', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    });

    await ensureColumn('wrongAnswers', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    });

    await ensureColumn('unansweredQuestions', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    });

    await ensureColumn('percentage', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    });

    await ensureColumn('autoSubmitted', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });

    await ensureColumn('violationReason', {
        type: DataTypes.STRING,
        allowNull: true,
    });

    testResultColumnsPromise = Promise.resolve(nextColumns);
    return nextColumns;
};
