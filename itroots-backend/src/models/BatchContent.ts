import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Batch from './Batch';

interface BatchContentAttributes {
    id: string;
    batchId: string;
    title: string;
    description?: string;
    type: 'VIDEO' | 'ASSIGNMENT' | 'RESOURCE' | 'CODING';
    contentUrl?: string;
    maxMarks?: number | null;
    codingLanguage?: string;
    starterCode?: string;
    codingInstructions?: string;
}

interface BatchContentCreationAttributes extends Optional<BatchContentAttributes, 'id' | 'description' | 'contentUrl' | 'maxMarks' | 'codingLanguage' | 'starterCode' | 'codingInstructions'> { }

export const BATCH_CONTENT_BASE_ATTRIBUTES = [
    'id',
    'batchId',
    'title',
    'description',
    'type',
    'contentUrl',
    'maxMarks',
    'createdAt',
    'updatedAt',
] as const;

const BATCH_CONTENT_OPTIONAL_ATTRIBUTES = [
    'maxMarks',
    'codingLanguage',
    'starterCode',
    'codingInstructions',
] as const;

type BatchContentColumnSet = Set<string>;

let batchContentColumnsPromise: Promise<BatchContentColumnSet> | null = null;

const describeBatchContentColumns = async () => {
    if (!batchContentColumnsPromise) {
        batchContentColumnsPromise = sequelize
            .getQueryInterface()
            .describeTable('batch_contents')
            .then((tableDefinition) => new Set(Object.keys(tableDefinition)))
            .catch(() => new Set(BATCH_CONTENT_BASE_ATTRIBUTES.filter((attribute) => attribute !== 'maxMarks')));
    }

    return batchContentColumnsPromise;
};

export const getBatchContentReadableAttributes = async () => {
    const availableColumns = await describeBatchContentColumns();
    return [
        ...BATCH_CONTENT_BASE_ATTRIBUTES.filter((attribute) => availableColumns.has(attribute)),
        ...BATCH_CONTENT_OPTIONAL_ATTRIBUTES.filter((attribute) => availableColumns.has(attribute)),
    ];
};

export const ensureBatchContentOptionalColumns = async () => {
    const queryInterface = sequelize.getQueryInterface();
    const availableColumns = await describeBatchContentColumns();
    const nextColumns = new Set(availableColumns);

    const columnsToAdd: Array<{ name: string; definition: { type: any; allowNull: boolean } }> = [];

    if (!availableColumns.has('maxMarks')) {
        columnsToAdd.push({
            name: 'maxMarks',
            definition: { type: DataTypes.INTEGER, allowNull: true },
        });
    }

    if (!availableColumns.has('codingLanguage')) {
        columnsToAdd.push({
            name: 'codingLanguage',
            definition: { type: DataTypes.STRING, allowNull: true },
        });
    }

    if (!availableColumns.has('starterCode')) {
        columnsToAdd.push({
            name: 'starterCode',
            definition: { type: DataTypes.TEXT, allowNull: true },
        });
    }

    if (!availableColumns.has('codingInstructions')) {
        columnsToAdd.push({
            name: 'codingInstructions',
            definition: { type: DataTypes.TEXT, allowNull: true },
        });
    }

    for (const column of columnsToAdd) {
        await queryInterface.addColumn('batch_contents', column.name, column.definition);
        nextColumns.add(column.name);
    }

    batchContentColumnsPromise = Promise.resolve(nextColumns);
    return nextColumns;
};

class BatchContent extends Model<BatchContentAttributes, BatchContentCreationAttributes> implements BatchContentAttributes {
    public id!: string;
    public batchId!: string;
    public title!: string;
    public description?: string;
    public type!: 'VIDEO' | 'ASSIGNMENT' | 'RESOURCE' | 'CODING';
    public contentUrl?: string;
    public maxMarks?: number | null;
    public codingLanguage?: string;
    public starterCode?: string;
    public codingInstructions?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

BatchContent.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        batchId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: Batch, key: 'id' }
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        type: {
            type: DataTypes.ENUM('VIDEO', 'ASSIGNMENT', 'RESOURCE', 'CODING'),
            allowNull: false,
        },
        contentUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        maxMarks: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        codingLanguage: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        starterCode: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        codingInstructions: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'BatchContent',
        tableName: 'batch_contents',
        timestamps: true,
    }
);

BatchContent.belongsTo(Batch, { as: 'batch', foreignKey: 'batchId' });
Batch.hasMany(BatchContent, { as: 'contents', foreignKey: 'batchId' });

export default BatchContent;
