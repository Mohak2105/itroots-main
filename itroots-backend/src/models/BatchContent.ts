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
    codingLanguage?: string;
    starterCode?: string;
    codingInstructions?: string;
}

interface BatchContentCreationAttributes extends Optional<BatchContentAttributes, 'id' | 'description' | 'contentUrl' | 'codingLanguage' | 'starterCode' | 'codingInstructions'> { }

class BatchContent extends Model<BatchContentAttributes, BatchContentCreationAttributes> implements BatchContentAttributes {
    public id!: string;
    public batchId!: string;
    public title!: string;
    public description?: string;
    public type!: 'VIDEO' | 'ASSIGNMENT' | 'RESOURCE' | 'CODING';
    public contentUrl?: string;
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
