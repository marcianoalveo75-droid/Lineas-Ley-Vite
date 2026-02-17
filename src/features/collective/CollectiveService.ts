import { collectiveDb, type Signal, type CollectiveState, type EmotionVector } from './CollectiveSchema';
import { analyzeText, calculateIntensity } from './EmotionModel';


export const CollectiveService = {

    async ingestSignals(texts: { source: string, text: string, date: string, region?: string }[]) {
        const signals: Signal[] = [];

        texts.forEach(item => {
            // 1. Analyze
            const emotionVector = analyzeText(item.text);
            const intensity = calculateIntensity(item.text);

            // 2. Create Signal
            if (Object.values(emotionVector).some(v => v > 0)) {
                signals.push({
                    source_id: item.source,
                    timestamp: new Date(item.date).getTime(),
                    text: item.text,
                    region: item.region || 'global',
                    emotion_vector: emotionVector,
                    intensity,
                    symbolic_tags: [] // TODO: Extract tags
                });
            }
        });

        // 3. Save to DB
        if (signals.length > 0) {
            await collectiveDb.signals.bulkAdd(signals);
            console.log(`[Collective] Ingested ${signals.length} signals.`);

            // 4. Update State immediately/debounced
            await this.updateCollectiveState('global');
        }
    },

    async updateCollectiveState(region: string = 'global') {
        // Aggregation Logic (Hourly Snapshot)
        // Get signals from last 24 hours
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);

        const recentSignals = await collectiveDb.signals
            .where('timestamp').above(oneDayAgo)
            .filter(s => s.region === region || region === 'global')
            .toArray();

        if (recentSignals.length === 0) return;

        // Sum vectors
        const totalVector: EmotionVector = {
            fear: 0, anger: 0, uncertainty: 0, hope: 0,
            control: 0, chaos: 0, transformation: 0, unity: 0
        };

        let totalIntensity = 0;

        recentSignals.forEach(s => {
            (Object.keys(totalVector) as Array<keyof EmotionVector>).forEach(k => {
                totalVector[k] += (s.emotion_vector[k] * s.intensity); // Weighted by intensity
            });
            totalIntensity += s.intensity;
        });

        // Normalize
        const count = recentSignals.length;
        const normalizedVector = { ...totalVector };
        (Object.keys(normalizedVector) as Array<keyof EmotionVector>).forEach(k => {
            normalizedVector[k] = normalizedVector[k] / count;
        });

        // Calculate Metrics
        // Emotional Temp = Avg Intensity * Density Factor (log scale)
        const temperature = (totalIntensity / count) * Math.log10(count + 1);

        // Coherence = Standard Deviation of dominant emotion? Or just how "spiky" the vector is?
        // Simple coherence: Max value in vector (if one emotion dominates, high coherence. If flat, low).
        const maxVal = Math.max(...Object.values(normalizedVector));
        const coherence = maxVal; // 0 to 1 approx

        // Pressure = Intensity * Tension-related emotions (Fear + Anger + Chaos)
        const pressure = (normalizedVector.fear + normalizedVector.anger + normalizedVector.chaos) * (temperature / 10);

        // Determine Phase
        let phase: CollectiveState['phase'] = 'transition';
        if (normalizedVector.fear > 0.4) phase = 'contraction';
        else if (normalizedVector.anger > 0.3) phase = 'rupture';
        else if (normalizedVector.hope > 0.4 && coherence > 0.5) phase = 'integration';
        else if (normalizedVector.unity > 0.3) phase = 'expansion';
        else if (pressure > 0.7) phase = 'tension';

        const state: CollectiveState = {
            timestamp: now,
            region,
            dominant_emotions: normalizedVector,
            emotional_temperature: Math.min(1.0, temperature),
            field_coherence: Math.min(1.0, coherence),
            pressure_index: Math.min(1.0, pressure),
            signal_count: count,
            phase
        };

        await collectiveDb.states.add(state);
        console.log("[Collective] State Updated:", state);
        return state;
    },

    async getLatestState(): Promise<CollectiveState | undefined> {
        return await collectiveDb.states.orderBy('timestamp').reverse().first();
    },

    // --- Mock Data Generator for Dev ---
    async generateMockData() {
        const lines = [
            "Global markets rally on news of peace treaty",
            "Massive protests erupt in capital city",
            "Scientists discover new renewable energy source",
            "Economy collapses, uncertainty rises",
            "Government imposes strict new regulations on AI",
            "Community comes together to rebuild after storm"
        ];

        const inputs = lines.map(t => ({
            source: 'simulation',
            text: t,
            date: new Date().toISOString()
        }));

        await this.ingestSignals(inputs);
    }
};
