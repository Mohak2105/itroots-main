import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Course from './Course';
import Batch from './Batch';
import User from './User';

export type LiveClassStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
export type LiveClassProvider = 'JITSI' | 'ZOOM' | 'EXTERNAL';

interface LiveClassAttributes {
    id: string;
    title: string;
    courseId: string;
    batchId: string;
    FacultyId: string;
    scheduledAt: Date;
    meetingLink: string;
    provider: LiveClassProvider;
    zoomMeetingNumber?: string | null;
    zoomPasscode?: string | null;
    jitsiRoomName?: string | null;
    joinPath?: string | null;
    description?: string;
    status: LiveClassStatus;
}

interface LiveClassCreationAttributes extends Optional<LiveClassAttributes, 'id' | 'description' | 'status' | 'provider' | 'zoomMeetingNumber' | 'zoomPasscode' | 'jitsiRoomName' | 'joinPath'> { }

class LiveClass extends Model<LiveClassAttributes, LiveClassCreationAttributes> implements LiveClassAttributes {
    public id!: string;
    public title!: string;
    public courseId!: string;
    public batchId!: string;
    public FacultyId!: string;
    public scheduledAt!: Date;
    public meetingLink!: string;
    public provider!: LiveClassProvider;
    public zoomMeetingNumber?: string | null;
    public zoomPasscode?: string | null;
    public jitsiRoomName?: string | null;
    public joinPath?: string | null;
    public description?: string;
    public status!: LiveClassStatus;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

LiveClass.init(
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
        courseId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: Course, key: 'id' },
        },
        batchId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: Batch, key: 'id' },
        },
        FacultyId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'teacherId',
            references: { model: User, key: 'id' },
        },
        scheduledAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        meetingLink: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        provider: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'EXTERNAL',
        },
        zoomMeetingNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        zoomPasscode: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        jitsiRoomName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        joinPath: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('SCHEDULED', 'CANCELLED', 'COMPLETED'),
            allowNull: false,
            defaultValue: 'SCHEDULED',
        },
    },
    {
        sequelize,
        modelName: 'LiveClass',
        tableName: 'live_classes',
        timestamps: true,
    }
);

LiveClass.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });
LiveClass.belongsTo(Batch, { as: 'batch', foreignKey: 'batchId' });
LiveClass.belongsTo(User, { as: 'Faculty', foreignKey: 'FacultyId' });
Course.hasMany(LiveClass, { as: 'liveClasses', foreignKey: 'courseId' });
Batch.hasMany(LiveClass, { as: 'liveClasses', foreignKey: 'batchId' });
User.hasMany(LiveClass, { as: 'scheduledLiveClasses', foreignKey: 'FacultyId' });

export default LiveClass;
