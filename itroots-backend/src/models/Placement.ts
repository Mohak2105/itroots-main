import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface PlacementAttributes {
    id: string;
    companyName: string;
    designation: string;
    salaryRange: string;
    jobDescription: string;
    passoutYears: string;
    applyLink: string;
    companyLogo?: string;
}

class Placement extends Model<PlacementAttributes> implements PlacementAttributes {
    public id!: string;
    public companyName!: string;
    public designation!: string;
    public salaryRange!: string;
    public jobDescription!: string;
    public passoutYears!: string;
    public applyLink!: string;
    public companyLogo!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Placement.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        companyName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        designation: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        salaryRange: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        jobDescription: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        passoutYears: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        applyLink: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        companyLogo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Placement',
        tableName: 'placements',
    }
);

export default Placement;
