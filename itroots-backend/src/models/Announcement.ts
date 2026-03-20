import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Batch from './Batch';

class Announcement extends Model { }

Announcement.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        batchId: {
            type: DataTypes.UUID,
            allowNull: true, // If null, it's a global announcement
            references: { model: Batch, key: 'id' }
        },
        authorId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: User, key: 'id' }
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        priority: {
            type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT'),
            defaultValue: 'NORMAL',
        }
    },
    {
        sequelize,
        modelName: 'Announcement',
        tableName: 'announcements',
        timestamps: true,
    }
);

Announcement.belongsTo(Batch, { as: 'batch', foreignKey: 'batchId' });
Announcement.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
Batch.hasMany(Announcement, { as: 'announcements', foreignKey: 'batchId' });

export default Announcement;
