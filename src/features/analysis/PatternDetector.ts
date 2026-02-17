import { type LeyLine } from '../map/mapSlice';
import { type Entity } from './EntityDatabase';
import { bboxPolygon, lineString, booleanDisjoint, lineIntersect, booleanPointInPolygon, center, bearing, distance, point } from '@turf/turf';
import { fetchAreaNews } from './NewsService';
import { type NewsItem } from './types';
import { type SocialPost } from './SocialService';
import { analyzeHolisticStats, type HolisticStats } from './HolisticAnalyzer';
import { fetchRemoteAnalysis } from './AnalysisAPI';
import type { NewsConfig } from './providers/NewsProvider';

export interface PatternResult {
    type: string;
    description: string;
    coordinates: number[][];
}

export interface AnalysisResult {
    patterns: PatternResult[];
    entities: Entity[];
    news: NewsItem[];
    social: SocialPost[];
    stats: {
        energyLevel: number;
        anomalyProbability: number;
        vibration: number;
        holistic: HolisticStats;
        astral?: {
            moonPhase: string;
            moonIllumination: number;
            moonSentiment: string;
        };
        planetary?: {
            schumannHz: number;
            schumannState: string;
            seismicActivity: {
                count: number;
                maxMagnitude: number;
                lastQuake: string;
                details?: any[];
            };
        };
    };
    collective_field?: {
        scores: Record<string, number>;
        dominant: string;
        density_index: number;
    };
    locationContext?: {
        name: string;
        countryCode: string;
        countryCodes: string[];
    };
    diagnosis?: string;
    bounds?: [[number, number], [number, number]] | null;
    markers?: any[];
    leyLines?: LeyLine[];
    dateRange?: { from: string; to: string };
}

export async function detectPatterns(lines: LeyLine[], bounds: [[number, number], [number, number]], config: NewsConfig, activeMarkers?: any[]): Promise<AnalysisResult> {
    const patterns: PatternResult[] = [];
    const bbox = bboxPolygon([bounds[0][1], bounds[0][0], bounds[1][1], bounds[1][0]]);

    const relevantLines = lines.filter(line => {
        if (line.markers.length < 2) return false;
        const lineStringObj = lineString(line.markers.map(m => [m.lng, m.lat]));
        return !booleanDisjoint(lineStringObj, bbox);
    });

    if (relevantLines.length < 2) {
        patterns.push({ type: 'Info', description: 'Se necesitan más líneas para detectar patrones.', coordinates: [] });
        return {
            patterns,
            entities: [],
            news: [],
            social: [],
            stats: {
                energyLevel: 10,
                anomalyProbability: 5,
                vibration: 20,
                holistic: { harmony: 50, tension: 10, collaboration: 20, renewal: 30, emotionalClimate: 50 }
            },
            locationContext: {
                name: "Desconocido",
                countryCode: "pa",
                countryCodes: ["pa"]
            }
        };
    }

    // Geometry detection logic... (omitted for brevity in prompt, but I will write the full code)
    for (let i = 0; i < relevantLines.length; i++) {
        for (let j = i + 1; j < relevantLines.length; j++) {
            const l1 = lineString(relevantLines[i].markers.map(m => [m.lng, m.lat]));
            const l2 = lineString(relevantLines[j].markers.map(m => [m.lng, m.lat]));
            const intersection = lineIntersect(l1, l2);
            if (intersection.features.length > 0) {
                intersection.features.forEach(feat => {
                    const coords = feat.geometry.coordinates;
                    if (booleanPointInPolygon(feat, bbox)) {
                        patterns.push({
                            type: 'Intersección',
                            description: `Cruce de poder entre "${relevantLines[i].name}" y "${relevantLines[j].name}"`,
                            coordinates: [coords as number[]]
                        });
                    }
                });
            }
        }
    }

    if (relevantLines.length < 20) {
        for (let i = 0; i < relevantLines.length; i++) {
            for (let j = i + 1; j < relevantLines.length; j++) {
                for (let k = j + 1; k < relevantLines.length; k++) {
                    const ls1 = lineString(relevantLines[i].markers.map(m => [m.lng, m.lat]));
                    const ls2 = lineString(relevantLines[j].markers.map(m => [m.lng, m.lat]));
                    const ls3 = lineString(relevantLines[k].markers.map(m => [m.lng, m.lat]));
                    if (lineIntersect(ls1, ls2).features.length > 0 &&
                        lineIntersect(ls2, ls3).features.length > 0 &&
                        lineIntersect(ls3, ls1).features.length > 0) {
                        const c1 = center(ls1).geometry.coordinates;
                        const c2 = center(ls2).geometry.coordinates;
                        const c3 = center(ls3).geometry.coordinates;
                        const triangleCenter = [(c1[0] + c2[0] + c3[0]) / 3, (c1[1] + c2[1] + c3[1]) / 3];
                        patterns.push({
                            type: 'Triángulo de Poder',
                            description: `Vórtice formado por: ${relevantLines[i].name}, ${relevantLines[j].name}, ${relevantLines[k].name}`,
                            coordinates: [[triangleCenter[0], triangleCenter[1]]]
                        });
                    }
                }
            }
        }
    }

    const hubs: { center: number[], lines: Set<string> }[] = [];
    patterns.filter(p => p.type === 'Intersección').forEach(p => {
        const coords = p.coordinates[0];
        const pt = point([coords[0], coords[1]]);
        let foundHub = false;
        for (const hub of hubs) {
            if (distance(pt, point(hub.center), { units: 'kilometers' }) < 0.2) {
                const matches = p.description.match(/"([^"]+)"/g);
                if (matches) matches.forEach(m => hub.lines.add(m.replace(/"/g, '')));
                foundHub = true;
                break;
            }
        }
        if (!foundHub) {
            const matches = p.description.match(/"([^"]+)"/g);
            const lineSet = new Set<string>();
            if (matches) matches.forEach(m => lineSet.add(m.replace(/"/g, '')));
            hubs.push({ center: coords, lines: lineSet });
        }
    });

    hubs.forEach(hub => {
        if (hub.lines.size >= 4) {
            patterns.push({
                type: 'Nodo de Convergencia',
                description: `Súper-vórtice (HUB) detectado. Convergencia de ${hub.lines.size} líneas ley: ${Array.from(hub.lines).join(', ')}`,
                coordinates: [[hub.center[0], hub.center[1]]]
            });
        }
    });

    const referenceAzimuths = [
        { name: 'Sirio', deg: 105 },
        { name: 'Cinturón de Orión', deg: 270 },
        { name: 'Pléyades', deg: 65 },
        { name: 'Cruz del Sur', deg: 180 }
    ];

    relevantLines.forEach((line, i) => {
        const start = line.markers[0];
        const end = line.markers[line.markers.length - 1];
        let lineBearing = bearing([start.lng, start.lat], [end.lng, end.lat]);
        if (lineBearing < 0) lineBearing += 360;

        referenceAzimuths.forEach(star => {
            const diff = Math.abs(lineBearing - star.deg);
            const reverseDiff = Math.abs(((lineBearing + 180) % 360) - star.deg);
            if (diff < 2 || reverseDiff < 2) {
                patterns.push({
                    type: 'Alineamiento Celeste',
                    description: `Línea "${line.name}" alineada con el azimut de ${star.name} (${star.deg}°)`,
                    coordinates: [[(start.lat + end.lat) / 2, (start.lng + end.lng) / 2]]
                });
            }
        });

        for (let j = i + 1; j < relevantLines.length; j++) {
            const other = relevantLines[j];
            const oStart = other.markers[0];
            const oEnd = other.markers[other.markers.length - 1];
            let otherBearing = bearing([oStart.lng, oStart.lat], [oEnd.lng, oEnd.lat]);
            if (otherBearing < 0) otherBearing += 360;
            const bDiff = Math.abs((lineBearing % 180) - (otherBearing % 180));
            if (bDiff < 1.5) {
                const d = distance([(start.lng + end.lng) / 2, (start.lat + end.lat) / 2], [(oStart.lng + oEnd.lng) / 2, (oStart.lat + oEnd.lat) / 2], { units: 'kilometers' });
                if (d < 0.5) {
                    patterns.push({
                        type: 'Corredor de Energía',
                        description: `Corredor paralelo detectado entre "${line.name}" y "${other.name}"`,
                        coordinates: [[(start.lat + oStart.lat) / 2, (start.lng + oStart.lng) / 2]]
                    });
                }
            }
        }
    });

    const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
    const centerLng = (bounds[0][1] + bounds[1][1]) / 2;

    let news: NewsItem[] = [];
    let social: any[] = [];
    let entities: Entity[] = [];
    let holistic: HolisticStats = { harmony: 50, tension: 10, collaboration: 20, renewal: 30, emotionalClimate: 50 };
    let astral: any = null;
    let planetaryStats: any = { seismicActivity: { count: 0, maxMagnitude: 0, details: [] } };
    let energyLevel = 0;
    let anomalyProbability = 0;
    let vibration = 0;
    let collectiveField = null;
    let backendDataRes: any = null;

    let locationName = "Zona Analizada";
    let primaryCountryCode = "pa";
    let countryCodes: string[] = ["pa"];

    try {
        const quakeRes = await fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=10&minmagnitude=4.0&orderby=time');
        const quakeData = await quakeRes.json();
        if (quakeData.features?.length > 0) {
            const quakes = quakeData.features;
            const maxMag = Math.max(...quakes.map((q: any) => q.properties.mag));
            planetaryStats.seismicActivity = {
                count: quakes.length,
                maxMagnitude: maxMag,
                lastQuake: new Date(quakes[0].properties.time).toLocaleTimeString(),
                details: quakes.map((q: any) => ({
                    place: q.properties.place,
                    mag: q.properties.mag,
                    time: new Date(q.properties.time).toISOString()
                }))
            };
            const schumannHz = 7.83 + (maxMag * 0.05) + (Math.random() * 0.02);
            planetaryStats.schumannState = `${maxMag > 6 ? "High Activity" : "Stable"} (${schumannHz.toFixed(2)} Hz)`;
        } else {
            // Default base frequency if no seismic events
            const baseHz = 7.83 + (Math.random() * 0.02);
            planetaryStats.schumannState = `Stable (${baseHz.toFixed(2)} Hz)`;
        }
    } catch (e) { console.warn("Planetary fetch failed", e); }

    try {
        // Multi-point Geocoding to identify all countries in the selection box
        const checkPoints = [
            [centerLat, centerLng],     // Center
            [bounds[0][0], bounds[0][1]], // SW
            [bounds[1][0], bounds[1][1]], // NE
            [bounds[0][0], bounds[1][1]], // NW
            [bounds[1][0], bounds[0][1]]  // SE
        ];

        const countriesSet = new Set<string>();
        const namesSet = new Set<string>();

        // We'll check center first for primary, then others
        for (let i = 0; i < checkPoints.length; i++) {
            try {
                const [plat, plon] = checkPoints[i];
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${plat}&lon=${plon}`);
                const geoData = await geoRes.json();
                if (geoData.address) {
                    const cCode = geoData.address.country_code || "pa";
                    countriesSet.add(cCode);
                    if (i === 0) primaryCountryCode = cCode; // Primary is the center

                    const loc = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.state || "Zona";
                    namesSet.add(loc);
                    if (geoData.address.country) namesSet.add(geoData.address.country);
                }
            } catch (e) { console.warn("Geocoding point failed", e); }
            // Throttle slightly to respect Nominatim usage
            if (i < checkPoints.length - 1) await new Promise(r => setTimeout(r, 200));
        }

        if (countriesSet.size > 0) {
            countryCodes = Array.from(countriesSet);
            // If we have multiple countries, broaden the location name
            if (countriesSet.size > 1) {
                locationName = `Región Transfronteriza (${Array.from(countriesSet).map(c => c.toUpperCase()).join('/')})`;
            } else if (namesSet.size > 0) {
                locationName = Array.from(namesSet).slice(0, 2).join(', ');
            }
        }

        backendDataRes = await fetchRemoteAnalysis(
            centerLat, centerLng, locationName, primaryCountryCode,
            config.newsApiKey || "", config.mediastackApiKey, config.keyword, config.extraKeywords,
            config.dateFrom, config.dateTo, countryCodes
        );

        if (backendDataRes) {
            holistic.tension = backendDataRes.indices.chaos;
            holistic.emotionalClimate = 100 - backendDataRes.indices.despair;
            holistic.harmony = 100 - backendDataRes.indices.oppression;
            holistic.renewal = backendDataRes.indices.intensity;

            const hubBoost = patterns.filter(p => p.type === 'Nodo de Convergencia').length * 40;
            const triBoost = patterns.filter(p => p.type === 'Triángulo de Poder').length * 20;
            energyLevel = Math.min(100, backendDataRes.indices.intensity + hubBoost + triBoost);
            anomalyProbability = Math.min(100, backendDataRes.indices.oppression + (patterns.filter(p => p.type === 'Intersección').length * 10) + hubBoost);
            vibration = Math.min(100, holistic.emotionalClimate + (patterns.filter(p => p.type === 'Alineamiento Celeste').length * 15));

            if (backendDataRes.environmental_context?.moon) {
                astral = {
                    moonPhase: backendDataRes.environmental_context.moon.name,
                    moonIllumination: backendDataRes.environmental_context.moon.illumination,
                    moonSentiment: backendDataRes.environmental_context.moon.sentiment
                };
            }

            if (backendDataRes.detected_entities) {
                entities = backendDataRes.detected_entities.map((e: any) => ({
                    ...e,
                    coordinates: e.coordinates || [centerLat + (Math.random() - 0.5) * 0.01, centerLng + (Math.random() - 0.5) * 0.01]
                }));
            }

            if (backendDataRes.news_context?.articles?.length > 0) {
                news = backendDataRes.news_context.articles.map((a: any) => ({
                    id: a.url || Math.random().toString(),
                    title: a.title, url: a.url, source: a.source || 'Unknown',
                    sentiment: a.sentiment || 'neutral', date: a.date || new Date().toISOString(),
                    description: a.description || a.snippet || 'Sin descripción disponible.'
                }));
            }

            if (backendDataRes.environmental_context) {
                if (backendDataRes.environmental_context.quakes > 0 || backendDataRes.environmental_context.quake_details?.length > 0) {
                    const localQuakes = backendDataRes.environmental_context.quake_details || [];
                    planetaryStats.seismicActivity.count = backendDataRes.environmental_context.quakes;
                    planetaryStats.seismicActivity.details = [...(planetaryStats.seismicActivity.details || []), ...localQuakes];
                }
                social.push({
                    id: 'env-1', platform: 'System', user: 'WeatherModule',
                    content: `Weather Code: ${backendDataRes.environmental_context.weather?.weather_code || 'N/A'}`,
                    likes: 0, url: '#', sentiment: 'neutral', timestamp: new Date().toISOString()
                });
            }
            if (backendDataRes.collective_field) collectiveField = backendDataRes.collective_field;
        } else {
            console.warn("Backend unavailable, using client simulation.");
            news = await fetchAreaNews(centerLat, centerLng, config, locationName, primaryCountryCode, countryCodes);
            const { searchEntities: fallbackSearch } = await import('./EntityDatabase');
            entities = await fallbackSearch(bounds);
            holistic = analyzeHolisticStats(news);
            energyLevel = Math.min(100, (patterns.length * 10) + (holistic.tension / 2));
            anomalyProbability = Math.min(100, (patterns.filter(p => p.type === 'Intersección').length * 15) + (holistic.tension / 2));
            vibration = Math.min(100, holistic.emotionalClimate);
        }
    } catch (error) {
        console.error("Analysis process failed:", error);
    }

    return {
        patterns, entities, news, social,
        stats: { energyLevel, anomalyProbability, vibration, holistic, astral, planetary: planetaryStats },
        collective_field: collectiveField,
        locationContext: { name: locationName, countryCode: primaryCountryCode, countryCodes },
        bounds, markers: activeMarkers || [], leyLines: lines,
        diagnosis: generateDiagnosis(holistic),
        dateRange: { from: config.dateFrom || "", to: config.dateTo || "" }
    };
}

function generateDiagnosis(h: HolisticStats): string {
    const lines = [];
    if (h.tension > 60) lines.push("⚠️ CAOS CRÍTICO: Alta volatilidad detectada. Se recomienda precaución extrema.");
    if (h.harmony < 30) lines.push("🛡️ OPRESIÓN: Atmósfera espiritual pesada. Protocolos de protección recomendados.");
    if (h.emotionalClimate < 40) lines.push("🌫️ DESESPERANZA: Baja resonancia emocional en la esfera colectiva.");
    if (h.renewal > 70) lines.push("✨ RENOVACIÓN: Fuertes corrientes de cambio y purificación detectadas.");
    return lines.length > 0 ? lines.join(" ") : "✅ ESTADO ESTABLE: No se detectan anomalías mayores.";
}
