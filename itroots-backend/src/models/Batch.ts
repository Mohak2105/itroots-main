import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Course from './Course';
import User from './User';

interface BatchAttributes {
    id: string;
    name: string;
    courseId: string;
    teacherId: string;
    schedule: string;
    startDate: string;
    endDate: string;
}

class Batch extends Model<BatchAttributes> implements BatchAttributes {
    public id!: string;
    public name!: string;
    public courseId!: string;
    public teacherId!: string;
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
        teacherId: {
            type: DataTypes.UUID,
            allowNull: false,
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
Batch.belongsTo(User, { as: 'teacher', foreignKey: 'teacherId' });
Course.hasMany(Batch, { as: 'batches', foreignKey: 'courseId' });
User.hasMany(Batch, { as: 'teacherBatches', foreignKey: 'teacherId' });

export default Batch;
