import { openDB, DBSchema } from 'idb';

export type Measurement = {
    id: string;
    timestamp: number;
    volume: number;
    bottleId: string;
    imageData: Blob;
};

export type RetentionPeriod = 'forever' | '24h' | '7d' | '30d';

const DB_NAME = 'pee-meter-db';
const STORE_NAME = 'measurements';
const RETENTION_KEY = 'pee-meter-retention';

interface PeeMeterDB extends DBSchema {
    measurements: {
        key: string;
        value: Measurement;
        indexes: { 'by-date': number };
    };
}

const dbPromise = typeof window !== 'undefined'
    ? openDB<PeeMeterDB>(DB_NAME, 1, {
        upgrade(db) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('by-date', 'timestamp');
        },
    })
    : Promise.resolve(null);

export const saveMeasurement = async (measurement: Omit<Measurement, 'id' | 'timestamp'>) => {
    const db = await dbPromise;
    if (!db) return;

    const newMeasurement: Measurement = {
        ...measurement,
        id: generateUUID(),
        timestamp: Date.now(),
    };

    await db.put(STORE_NAME, newMeasurement);
};

function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export const getHistory = async (): Promise<Measurement[]> => {
    const db = await dbPromise;
    if (!db) return [];
    return (await db.getAllFromIndex(STORE_NAME, 'by-date')).reverse();
};

export const deleteMeasurement = async (id: string) => {
    const db = await dbPromise;
    if (!db) return;
    await db.delete(STORE_NAME, id);
};

export const setRetentionPeriod = (period: RetentionPeriod) => {
    localStorage.setItem(RETENTION_KEY, period);
    cleanupHistory(period);
};

export const getRetentionPeriod = (): RetentionPeriod => {
    if (typeof window === 'undefined') return 'forever';
    return (localStorage.getItem(RETENTION_KEY) as RetentionPeriod) || 'forever';
};

export const cleanupHistory = async (period?: RetentionPeriod) => {
    const p = period || getRetentionPeriod();
    if (p === 'forever') return;

    const db = await dbPromise;
    if (!db) return;

    const now = Date.now();
    let cutoff = 0;

    switch (p) {
        case '24h': cutoff = 24 * 60 * 60 * 1000; break;
        case '7d': cutoff = 7 * 24 * 60 * 60 * 1000; break;
        case '30d': cutoff = 30 * 24 * 60 * 60 * 1000; break;
    }

    const range = IDBKeyRange.upperBound(now - cutoff);
    const oldItems = await db.getAllKeysFromIndex(STORE_NAME, 'by-date', range);

    const tx = db.transaction(STORE_NAME, 'readwrite');
    await Promise.all(oldItems.map(key => tx.store.delete(key)));
    await tx.done;
};
