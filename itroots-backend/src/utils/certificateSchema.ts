import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

let certificateColumnsPromise: Promise<Set<string>> | null = null;
let certificateTableReady: boolean | null = null;

const describeCertificateColumns = async () => {
    try {
        const tableDefinition = await sequelize.getQueryInterface().describeTable('certificates');
        return new Set(Object.keys(tableDefinition));
    } catch {
        return new Set<string>();
    }
};

const getCertificateColumns = async () => {
    if (!certificateColumnsPromise) {
        certificateColumnsPromise = describeCertificateColumns();
    }

    return certificateColumnsPromise;
};

export const isCertificateTableReady = async () => {
    if (certificateTableReady !== null) return certificateTableReady;

    const columns = await getCertificateColumns();
    certificateTableReady = columns.size > 0;
    return certificateTableReady;
};

export const ensureCertificateSignatureColumn = async () => {
    const tableReady = await isCertificateTableReady();
    if (!tableReady) return new Set<string>();

    const queryInterface = sequelize.getQueryInterface();
    const availableColumns = await getCertificateColumns();
    const nextColumns = new Set(availableColumns);

    if (!availableColumns.has('signatorySignature')) {
        await queryInterface.addColumn('certificates', 'signatorySignature', {
            type: DataTypes.STRING,
            allowNull: true,
        });
        nextColumns.add('signatorySignature');
    }

    certificateColumnsPromise = Promise.resolve(nextColumns);
    return nextColumns;
};
