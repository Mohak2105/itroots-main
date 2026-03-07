import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Batch from './Batch';

class Attendance extends Model { }

Attendance.init(
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
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('PRESENT', 'ABSENT', 'LATE'),
            allowNull: false,
            defaultValue: 'PRESENT',
        },
        remarks: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    },
    {
        sequelize,
        modelName: 'Attendance',
        tableName: 'attendance',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['studentId', 'batchId', 'date']
            }
        ]
    }
);

Attendance.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
Attendance.belongsTo(Batch, { as: 'batch', foreignKey: 'batchId' });
User.hasMany(Attendance, { as: 'attendanceRecords', foreignKey: 'studentId' });
Batch.hasMany(Attendance, { as: 'attendanceRecords', foreignKey: 'batchId' });

export default Attendance;
