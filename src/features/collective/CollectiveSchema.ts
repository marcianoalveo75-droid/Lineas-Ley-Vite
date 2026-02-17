import Dexie, { type Table } from 'dexie';

// --- Types ---

export type EmotionType = 'fear' | 'anger' | 'uncertainty' | 'hope' | 'control' | 'chaos' | 'transformation' | 'unity';

export interface EmotionVector {
    fear: number;
    anger: number;
    uncertainty: number;
    hope: number;
    control: number;
    chaos: number;
    transformation: number;
    unity: number;
}

export interface SourceConfig {
    id: string;
    type: 'rss' | 'api' | 'user' | 'system';
    name: string;
    url?: string;
    region: string;
    weight: number; // 0.1 to 2.0 (Influence multiplier)
    reliability: number; // 0.0 to 1.0
    last_updated: number;
}

export interface Signal {
    id?: number; // Auto-increment
    source_id: string;
    timestamp: number;
    text: string; // The headline/comment (normalized)
    language?: string;
    region?: string;
    emotion_vector: EmotionVector;
    intensity: number; // 0.0 to 1.0 (How "loud" is this signal?)
    symbolic_tags: string[];
}

export interface CollectiveState {
    id?: number;
    timestamp: number;
    region: string;

    // Aggregated Metrics
    dominant_emotions: Partial<EmotionVector>; // Top 3 dominant emotions
    emotional_temperature: number; // Heat/Activity level
    field_coherence: number; // 0.0 (Chaotic) to 1.0 (Unified focus)
    pressure_index: number; // Pre-rupture metric

    signal_count: number; // Density
    phase: 'contraction' | 'tension' | 'rupture' | 'transition' | 'integration' | 'expansion';
}

// --- Database Class ---

export class CollectiveDatabase extends Dexie {
    sources!: Table<SourceConfig>;
    signals!: Table<Signal>;
    states!: Table<CollectiveState>;

    constructor() {
        super('CollectiveMindDB');
        this.version(1).stores({
            sources: 'id, type, region',
            signals: '++id, source_id, timestamp, region, [timestamp+region]',
            states: '++id, timestamp, region'
        });
    }
}

export const collectiveDb = new CollectiveDatabase();
