import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Course from './Course';
import Batch from './Batch';

interface CertificateAttributes {
    id: string;
    certificateNumber: string;
    studentId: string;
    courseId: string;
    batchId?: string;
    duration: string;
    signatoryName: string;
    signatoryTitle?: string;
    signatorySignature?: string | null;
    issueDate: Date;
    createdBy: string;
}

interface CertificateCreationAttributes extends Optional<CertificateAttributes, 'id' | 'batchId' | 'signatoryTitle' | 'signatorySignature' | 'issueDate'> { }

class Certificate extends Model<CertificateAttributes, CertificateCreationAttributes> implements CertificateAttributes {
    public id!: string;
    public certificateNumber!: string;
    public studentId!: string;
    public courseId!: string;
    public batchId?: string;
    public duration!: string;
    public signatoryName!: string;
    public signatoryTitle?: string;
    public signatorySignature?: string | null;
    public issueDate!: Date;
    public createdBy!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Certificate.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        certificateNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        studentId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: User, key: 'id' },
        },
        courseId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: Course, key: 'id' },
        },
        batchId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: Batch, key: 'id' },
        },
        duration: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        signatoryName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        signatoryTitle: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        signatorySignature: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        issueDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: User, key: 'id' },
        },
    },
    {
        sequelize,
        modelName: 'Certificate',
        tableName: 'certificates',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['studentId', 'courseId'],
            },
        ],
    }
);

Certificate.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
Certificate.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Certificate.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });
Certificate.belongsTo(Batch, { as: 'batch', foreignKey: 'batchId' });

User.hasMany(Certificate, { as: 'certificates', foreignKey: 'studentId' });
User.hasMany(Certificate, { as: 'issuedCertificates', foreignKey: 'createdBy' });
Course.hasMany(Certificate, { as: 'certificates', foreignKey: 'courseId' });
Batch.hasMany(Certificate, { as: 'certificates', foreignKey: 'batchId' });

export default Certificate;
