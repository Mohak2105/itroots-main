import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Batch from './Batch';
import BatchContent from './BatchContent';

interface AssignmentSubmissionAttributes {
    id: string;
    studentId: string;
    assignmentId: string;
    batchId: string;
    fileUrl?: string;
    fileName?: string;
    notes?: string;
    submittedCode?: string;
    codingLanguage?: string;
    status: 'SUBMITTED' | 'REVIEWED';
    grade?: number | null;
    feedback?: string | null;
    submittedAt: Date;
}

interface AssignmentSubmissionCreationAttributes extends Optional<AssignmentSubmissionAttributes, 'id' | 'notes' | 'grade' | 'feedback' | 'status' | 'submittedAt' | 'fileUrl' | 'fileName' | 'submittedCode' | 'codingLanguage'> {}

class AssignmentSubmission extends Model<AssignmentSubmissionAttributes, AssignmentSubmissionCreationAttributes> implements AssignmentSubmissionAttributes {
    public id!: string;
    public studentId!: string;
    public assignmentId!: string;
    public batchId!: string;
    public fileUrl?: string;
    public fileName?: string;
    public notes?: string;
    public submittedCode?: string;
    public codingLanguage?: string;
    public status!: 'SUBMITTED' | 'REVIEWED';
    public grade?: number | null;
    public feedback?: string | null;
    public submittedAt!: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

AssignmentSubmission.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        studentId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: User, key: 'id' },
        },
        assignmentId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: BatchContent, key: 'id' },
        },
        batchId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: Batch, key: 'id' },
        },
        fileUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        fileName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        submittedCode: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        codingLanguage: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('SUBMITTED', 'REVIEWED'),
            allowNull: false,
            defaultValue: 'SUBMITTED',
        },
        grade: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        feedback: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        submittedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: 'AssignmentSubmission',
        tableName: 'assignment_submissions',
        timestamps: true,
    }
);

AssignmentSubmission.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
AssignmentSubmission.belongsTo(BatchContent, { as: 'assignment', foreignKey: 'assignmentId' });
AssignmentSubmission.belongsTo(Batch, { as: 'batch', foreignKey: 'batchId' });
User.hasMany(AssignmentSubmission, { as: 'assignmentSubmissions', foreignKey: 'studentId' });
BatchContent.hasMany(AssignmentSubmission, { as: 'submissions', foreignKey: 'assignmentId' });
Batch.hasMany(AssignmentSubmission, { as: 'assignmentSubmissions', foreignKey: 'batchId' });

export default AssignmentSubmission;
