import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Batch from './Batch';

interface BatchContentAttributes {
    id: string;
    batchId: string;
    title: string;
    description?: string;
    type: 'VIDEO' | 'ASSIGNMENT' | 'RESOURCE';
    contentUrl: string;
}

interface BatchContentCreationAttributes extends Optional<BatchContentAttributes, 'id' | 'description'> { }

class BatchContent extends Model<BatchContentAttributes, BatchContentCreationAttributes> implements BatchContentAttributes {
    public id!: string;
    public batchId!: string;
    public title!: string;
    public description?: string;
    public type!: 'VIDEO' | 'ASSIGNMENT' | 'RESOURCE';
    public contentUrl!: string;

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
            type: DataTypes.ENUM('VIDEO', 'ASSIGNMENT', 'RESOURCE'),
            allowNull: false,
        },
        contentUrl: {
            type: DataTypes.STRING,
            allowNull: false,
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
