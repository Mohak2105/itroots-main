import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Batch from './Batch';

class Enrollment extends Model { }

Enrollment.init(
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
        batchId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: Batch, key: 'id' }
        },
        enrollmentDate: {
            type: DataTypes.DATEONLY,
            defaultValue: DataTypes.NOW,
        },
        status: {
            type: DataTypes.ENUM('ACTIVE', 'COMPLETED', 'DROPPED'),
            defaultValue: 'ACTIVE',
        }
    },
    {
        sequelize,
        modelName: 'Enrollment',
        tableName: 'enrollments',
        timestamps: true,
    }
);

// Define associations
Enrollment.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
Enrollment.belongsTo(Batch, { as: 'batch', foreignKey: 'batchId' });
User.belongsToMany(Batch, { through: Enrollment, as: 'enrolledBatches', foreignKey: 'studentId' });
Batch.belongsToMany(User, { through: Enrollment, as: 'students', foreignKey: 'batchId' });

export default Enrollment;
