import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Course from './Course';
import Batch from './Batch';

export type NotificationType =
    | 'ANNOUNCEMENT'
    | 'NOTIFICATION'
    | 'REMINDER'
    | 'ALERT'
    | 'PLACEMENT'
    | 'FEES';

export type NotificationAudience =
    | 'ALL_STUDENTS'
    | 'SELECTED_STUDENTS'
    | 'ALL_Faculty'
    | 'SELECTED_Faculty'
    | 'ALL_USERS'
    | 'SELECTED_BATCH'
    | 'SELECTED_BATCH_STUDENTS'
    | 'SELECTED_BATCH_Faculty'
    | 'SELECTED_COURSE'
    | 'SELECTED_COURSE_STUDENTS'
    | 'SELECTED_COURSE_Faculty';

interface NotificationAttributes {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    audienceType: NotificationAudience;
    sendEmail: boolean;
    createdBy: string;
    batchId?: string;
    courseId?: string;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'type' | 'sendEmail' | 'batchId' | 'courseId'> { }

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
    public id!: string;
    public title!: string;
    public message!: string;
    public type!: NotificationType;
    public audienceType!: NotificationAudience;
    public sendEmail!: boolean;
    public createdBy!: string;
    public batchId?: string;
    public courseId?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Notification.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('ANNOUNCEMENT', 'NOTIFICATION', 'REMINDER', 'ALERT', 'PLACEMENT', 'FEES'),
            allowNull: false,
            defaultValue: 'NOTIFICATION',
        },
        audienceType: {
            type: DataTypes.ENUM(
                'ALL_STUDENTS',
                'SELECTED_STUDENTS',
                'ALL_Faculty',
                'SELECTED_Faculty',
                'ALL_USERS',
                'SELECTED_BATCH',
                'SELECTED_BATCH_STUDENTS',
                'SELECTED_BATCH_Faculty',
                'SELECTED_COURSE',
                'SELECTED_COURSE_STUDENTS',
                'SELECTED_COURSE_Faculty'
            ),
            allowNull: false,
        },
        sendEmail: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: User, key: 'id' },
        },
        batchId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: Batch, key: 'id' },
        },
        courseId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: Course, key: 'id' },
        },
    },
    {
        sequelize,
        modelName: 'Notification',
        tableName: 'notifications',
        timestamps: true,
    }
);

Notification.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Notification.belongsTo(Batch, { as: 'batch', foreignKey: 'batchId' });
Notification.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });
User.hasMany(Notification, { as: 'createdNotifications', foreignKey: 'createdBy' });

export default Notification;
