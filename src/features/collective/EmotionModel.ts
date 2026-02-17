import type { EmotionVector } from './CollectiveSchema';

// --- Archetypal Keywords Dictionaries ---
// These should be expanded over time or loaded from a config file.

const KEYWORDS = {
    fear: [
        'crisis', 'peligro', 'colapso', 'guerra', 'amenaza', 'miedo', 'pánico', 'muerte',
        'tragedia', 'alerta', 'emergencia', 'catástrofe', 'temor', 'riesgo', 'falta',
        'danger', 'collapse', 'war', 'threat', 'fear', 'panic', 'death', 'tragedy', 'alert'
    ],
    anger: [
        'protesta', 'injusticia', 'ataque', 'furia', 'odio', 'violencia', 'crimen', 'estafa',
        'fraude', 'mentira', 'corrupción', 'rabia', 'golpe', 'denuncia', 'escándalo',
        'protest', 'injustice', 'attack', 'fury', 'hate', 'violence', 'crime', 'fraud', 'scam'
    ],
    uncertainty: [
        'podría', 'posible', 'duda', 'incierto', 'riesgo', 'especulación', 'rumor',
        'misterio', 'pregunta', 'confuso', 'volátil', 'inestable', 'espera', 'quizás',
        'maybe', 'possible', 'doubt', 'uncertain', 'risk', 'rumor', 'mystery', 'confusing'
    ],
    hope: [
        'avance', 'solución', 'acuerdo', 'promesa', 'futuro', 'mejora', 'éxito',
        'victoria', 'fe', 'cura', 'remedio', 'oportunidad', 'crecimiento', 'luz',
        'hope', 'solution', 'deal', 'agreement', 'promise', 'future', 'success', 'faith'
    ],
    control: [
        'regulación', 'vigilancia', 'restricción', 'ley', 'orden', 'policía', 'gobierno',
        'militar', 'censura', 'bloqueo', 'norma', 'límite', 'autoridad', 'mandato',
        'control', 'regulation', 'surveillance', 'restriction', 'law', 'order', 'police'
    ],
    chaos: [
        'desorden', 'confusión', 'disturbio', 'saqueo', 'derrumbe', 'anarquía', 'locura',
        'impredecible', 'accidente', 'error', 'fallo', 'roto', 'quiebre', 'dispersión',
        'chaos', 'disorder', 'confusion', 'riot', 'looting', 'anarchy', 'madness', 'error'
    ],
    transformation: [
        'cambio', 'reforma', 'renacimiento', 'nuevo', 'inicio', 'fin', 'transición',
        'evolución', 'despertar', 'revolución', 'innovación', 'adaptación', 'giro',
        'change', 'reform', 'rebirth', 'new', 'start', 'end', 'transition', 'evolution'
    ],
    unity: [
        'cooperación', 'alianza', 'unión', 'juntos', 'comunidad', 'apoyo', 'solidaridad',
        'equipo', 'paz', 'armonía', 'integración', 'reunión', 'amor', 'hermandad',
        'unity', 'cooperation', 'alliance', 'together', 'community', 'support', 'peace'
    ]
};

// --- Logic ---

export function analyzeText(text: string): EmotionVector {
    const normalized = text.toLowerCase();
    const vector: EmotionVector = {
        fear: 0, anger: 0, uncertainty: 0, hope: 0,
        control: 0, chaos: 0, transformation: 0, unity: 0
    };

    let totalHits = 0;

    // Count keyword matches
    (Object.keys(KEYWORDS) as Array<keyof typeof KEYWORDS>).forEach(emotion => {
        const words = KEYWORDS[emotion];
        let hits = 0;
        words.forEach(word => {
            if (normalized.includes(word)) {
                hits++;
                // Check simple intensifiers near the word? (Maybe too costly for now)
            }
        });
        vector[emotion] = hits;
        totalHits += hits;
    });

    // Normalize vector (0.0 to 1.0)
    if (totalHits > 0) {
        (Object.keys(vector) as Array<keyof EmotionVector>).forEach(k => {
            vector[k] = parseFloat((vector[k] / totalHits).toFixed(2));
        });
    }

    return vector;
}

export function calculateIntensity(text: string): number {
    // Simple heuristic: length + exclamation marks + uppercase words
    const lenScore = Math.min(1, text.length / 200);
    const exclamations = (text.match(/!/g) || []).length * 0.1;
    const caps = (text.match(/[A-Z]{2,}/g) || []).length * 0.05;

    return Math.min(1.0, lenScore + exclamations + caps);
}
