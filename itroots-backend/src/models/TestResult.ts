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
    correctAnswers: number;
    wrongAnswers: number;
    unansweredQuestions: number;
    percentage: number;
    autoSubmitted: boolean;
    violationReason?: string | null;
    submittedAt: Date;
}

interface TestResultCreationAttributes extends Optional<TestResultAttributes, 'id' | 'submittedAt' | 'violationReason'> { }

export const TEST_RESULT_BASE_ATTRIBUTES = [
    'id',
    'studentId',
    'testId',
    'score',
    'completionTime',
    'correctAnswers',
    'wrongAnswers',
    'unansweredQuestions',
    'percentage',
    'autoSubmitted',
    'violationReason',
    'submittedAt',
    'createdAt',
    'updatedAt',
] as const;

class TestResult extends Model<TestResultAttributes, TestResultCreationAttributes> implements TestResultAttributes {
    public id!: string;
    public studentId!: string;
    public testId!: string;
    public score!: number;
    public completionTime!: number;
    public correctAnswers!: number;
    public wrongAnswers!: number;
    public unansweredQuestions!: number;
    public percentage!: number;
    public autoSubmitted!: boolean;
    public violationReason?: string | null;
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
        correctAnswers: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        wrongAnswers: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        unansweredQuestions: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        percentage: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        autoSubmitted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        violationReason: {
            type: DataTypes.STRING,
            allowNull: true,
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
        indexes: [
            {
                unique: true,
                fields: ['studentId', 'testId'],
                name: 'uq_test_results_student_test',
            },
        ],
    }
);

TestResult.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
TestResult.belongsTo(Test, { as: 'test', foreignKey: 'testId' });
Test.hasMany(TestResult, { as: 'results', foreignKey: 'testId' });

export default TestResult;
