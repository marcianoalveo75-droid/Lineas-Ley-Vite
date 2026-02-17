// API Configuration
const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface Entity {
    id: string;
    name: string;
    type: string;
    influence: string;
    description: string;
    biblicalReference?: string;
    countermeasures?: string;
    alignment?: 'dark' | 'light';
    confidence?: number;
    coordinates?: [number, number];
}

// Fallback/Mock entities for when backend is offline or for hybrid generation
const mockEntities: Entity[] = [
    { id: '1', name: 'Baal', type: 'Principado', influence: 'Idolatría, Materialismo', description: 'Antigua deidad cananea asociada con las tormentas y la fertilidad.', biblicalReference: 'Jueces 2:13', alignment: 'dark', confidence: 95 },
    { id: '2', name: 'Astarot', type: 'Potestad', influence: 'Seducción, Lujuria', description: 'Deidad asociada con la fertilidad, el amor y la guerra.', biblicalReference: '1 Samuel 7:3', alignment: 'dark', confidence: 88 },
    { id: '3', name: 'Leviatán', type: 'Demonio Marino', influence: 'Orgullo, Caos', description: 'Monstruo marino bíblico, símbolo del caos y las fuerzas del mal.', biblicalReference: 'Isaías 27:1', alignment: 'dark', confidence: 92 },
    { id: '4', name: 'Mammon', type: 'Espíritu', influence: 'Avaricia, Riqueza injusta', description: 'Personificación de la riqueza y la avaricia.', biblicalReference: 'Mateo 6:24', alignment: 'dark', confidence: 85 },
    { id: '5', name: 'Legión', type: 'Multitud', influence: 'Opresión mental, Locura', description: 'Grupo de demonios que poseían a un hombre en Gadara.', biblicalReference: 'Marcos 5:9', alignment: 'dark', confidence: 98 },
];

const ADJECTIVES = ["Oscuro", "Antiguo", "Silencioso", "Errante", "Luminoso", "Voraz", "Eterno", "Oculto"];
const NOUNS = ["Guardián", "Espectro", "Vigilante", "Sombra", "Espíritu", "Devorador", "Oráculo", "Heraldo"];
const LOCATIONS = ["del Valle", "de las Sombras", "del Vórtice", "del Cruce", "de la Grieta", "del Abismo", "de la Niebla"];

export async function searchEntities(bounds: [[number, number], [number, number]]): Promise<Entity[]> {
    const lat = (bounds[0][0] + bounds[1][0]) / 2;
    const lng = (bounds[0][1] + bounds[1][1]) / 2;

    // Deterministic seed based on location
    const seed = Math.abs(lat * 1000 + lng * 1000);

    try {
        console.log('Fetching entities from backend...');
        const response = await fetch(`${API_URL}/entities`);
        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }
        const backendEntities: Entity[] = await response.json();

        // If we have backend data, we can mix it with procedural logic or just return it.
        // For now, let's filter or select based on the "seed" to simulate location relevance
        // In the future the backend will handle the geo-query directly.

        const count = (Math.floor(seed) % 3) + 1; // Select 1 to 3 entities
        const results: Entity[] = [];

        for (let i = 0; i < count; i++) {
            const index = Math.floor(seed + i * 13) % backendEntities.length;
            const e = backendEntities[index];
            results.push({
                ...e,
                id: `${e.id}-${i}`,
                coordinates: [
                    lat + (Math.random() - 0.5) * 0.01,
                    lng + (Math.random() - 0.5) * 0.01
                ],
                confidence: Math.floor(85 + (Math.random() * 10))
            });
        }

        return results;

    } catch (error) {
        console.warn('Backend unavailable, falling back to procedural generation:', error);

        // Fallback: Procedural Logic (Original)
        const count = (Math.floor(seed) % 3) + 1;
        const results: Entity[] = [];
        for (let i = 0; i < count; i++) {
            const localSeed = Math.floor(seed + i * 123);
            const adj = ADJECTIVES[localSeed % ADJECTIVES.length];
            const noun = NOUNS[(localSeed * 2) % NOUNS.length];
            const loc = LOCATIONS[(localSeed * 3) % LOCATIONS.length];
            const name = `${noun} ${adj} ${loc}`;
            const baseEntity = mockEntities[localSeed % mockEntities.length];

            results.push({
                id: `gen-${localSeed}`,
                name: name,
                type: baseEntity.type,
                influence: baseEntity.influence,
                description: `Entidad detectada en las coordenadas ${lat.toFixed(3)}, ${lng.toFixed(3)}. ${baseEntity.description}`,
                biblicalReference: baseEntity.biblicalReference,
                alignment: baseEntity.alignment,
                confidence: Math.floor(70 + (localSeed % 30))
            });
        }
        return results;
    }
}
