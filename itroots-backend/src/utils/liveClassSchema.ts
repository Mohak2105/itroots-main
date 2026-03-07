import sequelize from '../config/database';

let liveClassTableReady: boolean | null = null;

export const isLiveClassTableReady = async () => {
    if (liveClassTableReady !== null) return liveClassTableReady;

    try {
        const [rows] = await sequelize.query("SHOW TABLES LIKE 'live_classes'");
        liveClassTableReady = Array.isArray(rows) && rows.length > 0;
        return liveClassTableReady;
    } catch {
        liveClassTableReady = false;
        return false;
    }
};

export const resetLiveClassTableCache = () => {
    liveClassTableReady = null;
};
