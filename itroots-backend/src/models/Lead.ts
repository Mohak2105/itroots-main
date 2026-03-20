import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum LeadType {
    CONTACT = 'contact',
    ENROLLMENT = 'enrollment',
    HIRE = 'hire'
}

export enum LeadStatus {
    PENDING = 'pending',
    CONTACTED = 'contacted',
    CONVERTED = 'converted',
    REJECTED = 'rejected'
}

interface LeadAttributes {
    id: string;
    type: LeadType;
    name: string;
    email: string;
    phone: string;
    company?: string;
    course?: string; // For enrollment
    subject?: string; // For contact
    roles?: string; // For hire inquiries
    hiringVolume?: string; // For hire inquiries
    experienceLevel?: string; // For hire inquiries
    message?: string;
    status: LeadStatus;
}

interface LeadCreationAttributes extends Optional<LeadAttributes, 'id' | 'status'> { }

class Lead extends Model<LeadAttributes, LeadCreationAttributes> implements LeadAttributes {
    public id!: string;
    public type!: LeadType;
    public name!: string;
    public email!: string;
    public phone!: string;
    public company?: string;
    public course?: string;
    public subject?: string;
    public roles?: string;
    public hiringVolume?: string;
    public experienceLevel?: string;
    public message?: string;
    public status!: LeadStatus;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Lead.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        type: {
            type: DataTypes.ENUM(...Object.values(LeadType)),
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        company: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        course: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        roles: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        hiringVolume: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        experienceLevel: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(LeadStatus)),
            defaultValue: LeadStatus.PENDING,
        },
    },
    {
        sequelize,
        modelName: 'Lead',
        tableName: 'leads',
    }
);

export default Lead;
