import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

type TableColumnSet = Set<string>;

const tableColumnsCache = new Map<string, Promise<TableColumnSet>>();

const describeTableColumns = async (tableName: string) => {
    try {
        const tableDefinition = await sequelize.getQueryInterface().describeTable(tableName);
        return new Set(Object.keys(tableDefinition));
    } catch {
        return new Set<string>();
    }
};

const getTableColumns = async (tableName: string) => {
    if (!tableColumnsCache.has(tableName)) {
        tableColumnsCache.set(tableName, describeTableColumns(tableName));
    }

    return tableColumnsCache.get(tableName)!;
};

const setTableColumns = (tableName: string, columns: TableColumnSet) => {
    tableColumnsCache.set(tableName, Promise.resolve(columns));
};

const ensureOptionalColumns = async (
    tableName: string,
    columns: Array<{ name: string; definition: { type: any; allowNull: boolean } }>
) => {
    const queryInterface = sequelize.getQueryInterface();
    const availableColumns = await getTableColumns(tableName);

    if (!availableColumns.size) {
        return availableColumns;
    }

    const nextColumns = new Set(availableColumns);

    for (const column of columns) {
        if (nextColumns.has(column.name)) continue;

        await queryInterface.addColumn(tableName, column.name, column.definition);
        nextColumns.add(column.name);
    }

    setTableColumns(tableName, nextColumns);
    return nextColumns;
};

const ensureTeacherIdColumn = async (tableName: 'batches' | 'live_classes') => {
    const queryInterface = sequelize.getQueryInterface();
    const availableColumns = await getTableColumns(tableName);

    if (!availableColumns.size) {
        return availableColumns;
    }

    const nextColumns = new Set(availableColumns);

    if (!nextColumns.has('teacherId')) {
        await queryInterface.addColumn(tableName, 'teacherId', {
            type: DataTypes.CHAR(36),
            allowNull: true,
        });
        nextColumns.add('teacherId');
    }

    if (availableColumns.has('FacultyId')) {
        await sequelize.query(
            `UPDATE \`${tableName}\` SET \`teacherId\` = COALESCE(\`teacherId\`, \`FacultyId\`) WHERE \`teacherId\` IS NULL AND \`FacultyId\` IS NOT NULL`
        );
    }

    setTableColumns(tableName, nextColumns);
    return nextColumns;
};

export const ensureAcademicSchemaCompatibility = async () => {
    await ensureTeacherIdColumn('batches');
    await ensureTeacherIdColumn('live_classes');
    await ensureOptionalColumns('assignment_submissions', [
        {
            name: 'submittedCode',
            definition: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            name: 'codingLanguage',
            definition: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
    ]);
};
