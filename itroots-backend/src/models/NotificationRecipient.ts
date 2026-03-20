import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Notification from './Notification';

interface NotificationRecipientAttributes {
    id: string;
    notificationId: string;
    userId: string;
    emailSent: boolean;
    emailSentAt?: Date;
    readAt?: Date;
}

interface NotificationRecipientCreationAttributes extends Optional<NotificationRecipientAttributes, 'id' | 'emailSent' | 'emailSentAt' | 'readAt'> { }

class NotificationRecipient extends Model<NotificationRecipientAttributes, NotificationRecipientCreationAttributes> implements NotificationRecipientAttributes {
    public id!: string;
    public notificationId!: string;
    public userId!: string;
    public emailSent!: boolean;
    public emailSentAt?: Date;
    public readAt?: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

NotificationRecipient.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        notificationId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: Notification, key: 'id' },
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: User, key: 'id' },
        },
        emailSent: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        emailSentAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        readAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'NotificationRecipient',
        tableName: 'notification_recipients',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['notificationId', 'userId'],
            },
        ],
    }
);

NotificationRecipient.belongsTo(Notification, { as: 'notification', foreignKey: 'notificationId' });
NotificationRecipient.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Notification.hasMany(NotificationRecipient, { as: 'recipients', foreignKey: 'notificationId' });
User.hasMany(NotificationRecipient, { as: 'notificationRecipients', foreignKey: 'userId' });

export default NotificationRecipient;
