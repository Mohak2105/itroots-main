import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Test from './Test';

interface TestResultAttributes {
    id: string;
    studentId: string;
    testId: string;
    score: number;
    completionTime: number;
    submittedAt: Date;
}

interface TestResultCreationAttributes extends Optional<TestResultAttributes, 'id' | 'submittedAt'> { }

class TestResult extends Model<TestResultAttributes, TestResultCreationAttributes> implements TestResultAttributes {
    public id!: string;
    public studentId!: string;
    public testId!: string;
    public score!: number;
    public completionTime!: number;
    public submittedAt!: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

TestResult.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        studentId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: User, key: 'id' }
        },
        testId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: Test, key: 'id' }
        },
        score: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        completionTime: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        submittedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: 'TestResult',
        tableName: 'test_results',
        timestamps: true,
    }
);

TestResult.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
TestResult.belongsTo(Test, { as: 'test', foreignKey: 'testId' });
Test.hasMany(TestResult, { as: 'results', foreignKey: 'testId' });

export default TestResult;
