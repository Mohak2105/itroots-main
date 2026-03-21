import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

let liveClassTableReady: boolean | null = null;
let liveClassColumnsPromise: Promise<Set<string>> | null = null;

const describeLiveClassColumns = async () => {
    try {
        const tableDefinition = await sequelize.getQueryInterface().describeTable('live_classes');
        return new Set(Object.keys(tableDefinition));
    } catch {
        return new Set<string>();
    }
};

const getLiveClassColumns = async () => {
    if (!liveClassColumnsPromise) {
        liveClassColumnsPromise = describeLiveClassColumns();
    }

    return liveClassColumnsPromise;
};

export const isLiveClassTableReady = async () => {
    if (liveClassTableReady !== null) return liveClassTableReady;

    const columns = await getLiveClassColumns();
    liveClassTableReady = columns.size > 0;
    return liveClassTableReady;
};

export const getLiveClassReadableAttributes = async () => {
    const columns = await getLiveClassColumns();
    const hasTeacherId = columns.has('teacherId') || columns.has('FacultyId');
    const attributes: string[] = [];

    if (columns.has('id')) attributes.push('id');
    if (columns.has('title')) attributes.push('title');
    if (columns.has('courseId')) attributes.push('courseId');
    if (columns.has('batchId')) attributes.push('batchId');
    if (hasTeacherId) attributes.push('FacultyId');
    if (columns.has('scheduledAt')) attributes.push('scheduledAt');
    if (columns.has('meetingLink')) attributes.push('meetingLink');
    if (columns.has('provider')) attributes.push('provider');
    if (columns.has('zoomMeetingNumber')) attributes.push('zoomMeetingNumber');
    if (columns.has('zoomPasscode')) attributes.push('zoomPasscode');
    if (columns.has('jitsiRoomName')) attributes.push('jitsiRoomName');
    if (columns.has('joinPath')) attributes.push('joinPath');
    if (columns.has('description')) attributes.push('description');
    if (columns.has('status')) attributes.push('status');
    if (columns.has('createdAt')) attributes.push('createdAt');
    if (columns.has('updatedAt')) attributes.push('updatedAt');

    return attributes;
};

export const ensureLiveClassJitsiColumns = async () => {
    const tableReady = await isLiveClassTableReady();
    if (!tableReady) return new Set<string>();

    const queryInterface = sequelize.getQueryInterface();
    const availableColumns = await getLiveClassColumns();
    const nextColumns = new Set(availableColumns);

    if (!availableColumns.has('provider')) {
        await queryInterface.addColumn('live_classes', 'provider', {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'EXTERNAL',
        });
        nextColumns.add('provider');
    } else {
        await queryInterface.changeColumn('live_classes', 'provider', {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'EXTERNAL',
        });
    }

    if (!availableColumns.has('zoomMeetingNumber')) {
        await queryInterface.addColumn('live_classes', 'zoomMeetingNumber', {
            type: DataTypes.STRING,
            allowNull: true,
        });
        nextColumns.add('zoomMeetingNumber');
    }

    if (!availableColumns.has('zoomPasscode')) {
        await queryInterface.addColumn('live_classes', 'zoomPasscode', {
            type: DataTypes.STRING,
            allowNull: true,
        });
        nextColumns.add('zoomPasscode');
    }

    if (!availableColumns.has('joinPath')) {
        await queryInterface.addColumn('live_classes', 'joinPath', {
            type: DataTypes.STRING,
            allowNull: true,
        });
        nextColumns.add('joinPath');
    }

    if (!availableColumns.has('jitsiRoomName')) {
        await queryInterface.addColumn('live_classes', 'jitsiRoomName', {
            type: DataTypes.STRING,
            allowNull: true,
        });
        nextColumns.add('jitsiRoomName');
    }

    liveClassColumnsPromise = Promise.resolve(nextColumns);
    return nextColumns;
};

export const resetLiveClassTableCache = () => {
    liveClassTableReady = null;
    liveClassColumnsPromise = null;
};
