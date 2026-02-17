import Dexie, { type Table } from 'dexie';
import type { AnalysisResult } from './PatternDetector';

export interface AnalysisRecord extends AnalysisResult {
    id?: number;
    timestamp: number;
    zoneName: string;
    primaryCountry: string;
    // Enhanced Data for Detailed View
    markers: any[]; // Store full marker objects including lat/lng, name, analysis data
    leyLines: any[]; // Store full ley line objects including start/end, type, strength
    bounds: any; // Store analysis polygon bounds
    news: any[]; // Store news/social items used
}

class SpiritualDatabase extends Dexie {
    analyses!: Table<AnalysisRecord>;

    constructor() {
        super('SpiritualDB');
        this.version(1).stores({
            analyses: '++id, timestamp, zoneName, primaryCountry'
        });
    }
}

export const db = new SpiritualDatabase();

export const AnalysisHistoryService = {
    async saveAnalysis(result: AnalysisResult, context: { markers: any[], leyLines: any[], bounds: any, news: any[] }): Promise<number> {
        const record: AnalysisRecord = {
            ...result,
            timestamp: Date.now(),
            zoneName: result.locationContext?.name || "Unknown Zone",
            primaryCountry: result.locationContext?.countryCode || "unknown",
            markers: context.markers || [],
            leyLines: context.leyLines || [],
            bounds: context.bounds || null,
            news: context.news || []
        };
        return await db.analyses.add(record);
    },

    async getHistory(limit = 50): Promise<AnalysisRecord[]> {
        return await db.analyses.orderBy('timestamp').reverse().limit(limit).toArray();
    },

    async getAll(): Promise<AnalysisRecord[]> {
        return await db.analyses.orderBy('timestamp').reverse().toArray();
    },

    async getByCountry(countryCode: string): Promise<AnalysisRecord[]> {
        return await db.analyses.where('primaryCountry').equals(countryCode).toArray();
    },

    async clearHistory(): Promise<void> {
        return await db.analyses.clear();
    }
};
