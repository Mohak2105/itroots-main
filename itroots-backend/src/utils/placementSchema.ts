import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

let placementColumnsPromise: Promise<Set<string>> | null = null;
let placementTableReady: boolean | null = null;

const describePlacementColumns = async () => {
    try {
        const tableDefinition = await sequelize.getQueryInterface().describeTable('placements');
        return new Set(Object.keys(tableDefinition));
    } catch {
        return new Set<string>();
    }
};

const getPlacementColumns = async () => {
    if (!placementColumnsPromise) {
        placementColumnsPromise = describePlacementColumns();
    }

    return placementColumnsPromise;
};

export const isPlacementTableReady = async () => {
    if (placementTableReady !== null) return placementTableReady;

    const columns = await getPlacementColumns();
    placementTableReady = columns.size > 0;
    return placementTableReady;
};

export const ensurePlacementDueDateColumn = async () => {
    const tableReady = await isPlacementTableReady();
    if (!tableReady) return new Set<string>();

    const queryInterface = sequelize.getQueryInterface();
    const availableColumns = await getPlacementColumns();
    const nextColumns = new Set(availableColumns);

    if (!availableColumns.has('dueDate')) {
        await queryInterface.addColumn('placements', 'dueDate', {
            type: DataTypes.DATE,
            allowNull: true,
        });
        nextColumns.add('dueDate');
    }

    placementColumnsPromise = Promise.resolve(nextColumns);
    return nextColumns;
};
