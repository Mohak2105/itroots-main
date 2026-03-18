import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Course from './Course';
import User from './User';

interface BatchAttributes {
    id: string;
    name: string;
    courseId: string;
    FacultyId?: string | null;
    schedule: string;
    startDate: string;
    endDate: string;
}

class Batch extends Model<BatchAttributes> implements BatchAttributes {
    public id!: string;
    public name!: string;
    public courseId!: string;
    public FacultyId?: string | null;
    public schedule!: string;
    public startDate!: string;
    public endDate!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Batch.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        courseId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: Course, key: 'id' }
        },
        FacultyId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'teacherId',
            references: { model: User, key: 'id' }
        },
        schedule: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Batch',
        tableName: 'batches',
        timestamps: true,
    }
);

Batch.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });
Batch.belongsTo(User, { as: 'Faculty', foreignKey: 'FacultyId' });
Course.hasMany(Batch, { as: 'batches', foreignKey: 'courseId' });
User.hasMany(Batch, { as: 'FacultyBatches', foreignKey: 'FacultyId' });

export default Batch;
