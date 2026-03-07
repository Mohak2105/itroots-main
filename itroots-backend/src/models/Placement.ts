import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface PlacementAttributes {
    id: string;
    studentName: string;
    companyName: string;
    designation: string;
    package: string;
    image?: string;
    testimonial?: string;
    year: number;
}

class Placement extends Model<PlacementAttributes> implements PlacementAttributes {
    public id!: string;
    public studentName!: string;
    public companyName!: string;
    public designation!: string;
    public package!: string;
    public image?: string;
    public testimonial?: string;
    public year!: number;

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
        studentName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        companyName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        designation: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        package: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        testimonial: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Placement',
        tableName: 'placements',
    }
);

export default Placement;
