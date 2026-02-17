import { type NewsItem } from './types';

export interface HolisticStats {
    harmony: number;      // Positive content
    tension: number;      // Conflict/Negative content
    collaboration: number; // Community/Union
    renewal: number;      // New beginnings/Growth
    emotionalClimate: number; // 0 (Fear) to 100 (Hope)
}

const KEYWORDS = {
    harmony: ['paz', 'amor', 'ayuda', 'festival', 'arte', 'música', 'calma', 'unión', 'celebración', 'éxito', 'felicidad', 'tranquilidad'],
    tension: ['crimen', 'accidente', 'protesta', 'pelea', 'muerte', 'robo', 'conflicto', 'crisis', 'miedo', 'alerta', 'peligro', 'violencia'],
    collaboration: ['comunidad', 'grupo', 'juntos', 'equipo', 'alianza', 'reunión', 'voluntarios', 'apoyo', 'red', 'cooperación'],
    renewal: ['nuevo', 'inicio', 'apertura', 'nacimiento', 'creación', 'futuro', 'innovación', 'cambio', 'transformación', 'esperanza']
};

export function analyzeHolisticStats(news: NewsItem[]): HolisticStats {
    let harmonyCount = 0;
    let tensionCount = 0;
    let collaborationCount = 0;
    let renewalCount = 0;

    news.forEach(item => {
        // CRITICAL: Skip simulated news for statistical calculations to maintain analysis integrity
        if (item.source.includes("(Simulado)")) return;

        const text = item.title.toLowerCase();

        KEYWORDS.harmony.forEach(word => { if (text.includes(word)) harmonyCount++; });
        KEYWORDS.tension.forEach(word => { if (text.includes(word)) tensionCount++; });
        KEYWORDS.collaboration.forEach(word => { if (text.includes(word)) collaborationCount++; });
        KEYWORDS.renewal.forEach(word => { if (text.includes(word)) renewalCount++; });
    });

    // Normalize to 0-100 scale based on frequency density
    // We multiply by a factor to make the bars visible even with few matches
    const factor = 100 / (news.length || 1) * 2;

    const harmony = Math.min(100, Math.round(harmonyCount * factor));
    const tension = Math.min(100, Math.round(tensionCount * factor));
    const collaboration = Math.min(100, Math.round(collaborationCount * factor));
    const renewal = Math.min(100, Math.round(renewalCount * factor));

    // Emotional Climate: Balance between Harmony/Renewal vs Tension
    // 50 is neutral. >50 is positive, <50 is negative.
    const emotionalClimate = Math.min(100, Math.max(0, 50 + (harmony + renewal - tension) / 2));

    return {
        harmony,
        tension,
        collaboration,
        renewal,
        emotionalClimate
    };
}
