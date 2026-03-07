import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Batch from './Batch';

interface TestAttributes {
    id: string;
    batchId: string;
    title: string;
    description?: string;
    totalMarks: number;
    durationMinutes: number;
    questions: any;
}

interface TestCreationAttributes extends Optional<TestAttributes, 'id' | 'description'> { }

class Test extends Model<TestAttributes, TestCreationAttributes> implements TestAttributes {
    public id!: string;
    public batchId!: string;
    public title!: string;
    public description?: string;
    public totalMarks!: number;
    public durationMinutes!: number;
    public questions!: any;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Test.init(
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
        totalMarks: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 100,
        },
        durationMinutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 60,
        },
        questions: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
        },
    },
    {
        sequelize,
        modelName: 'Test',
        tableName: 'tests',
        timestamps: true,
    }
);

Test.belongsTo(Batch, { as: 'batch', foreignKey: 'batchId' });
Batch.hasMany(Test, { as: 'tests', foreignKey: 'batchId' });

export default Test;
