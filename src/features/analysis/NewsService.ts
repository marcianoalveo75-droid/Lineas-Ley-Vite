import type { NewsItem } from './types';
import { RSSProvider } from './providers/RSSProvider';
import { GNewsProvider } from './providers/GNewsProvider';
import { NewsAPIProvider } from './providers/NewsAPIProvider';
import { MediastackProvider } from './providers/MediastackProvider';
import { GoogleCustomSearchProvider } from './providers/GoogleCustomSearchProvider';
import type { NewsConfig } from './providers/NewsProvider';

// Configuration default if not provided
// const DEFAULT_SIMULATION = true;

const THEMES = [
    "Luces extrañas avistadas en cielo despejado",
    "Ruidos subterráneos inexplicables reportados por vecinos",
    "Picos magnéticos inusuales detectados por aficionados",
    "Cronología oculta: hallazgos arqueológicos omitidos en la zona",
    "Avistamiento de orbes lumínicos sobre áreas boscosas",
    "Interferencias masivas en señales de radio y Wi-Fi",
    "Testimonios locales describen 'niebla inteligente'",
    "Antigua leyenda de la zona resurge tras eventos recientes",
    "Investigadores de lo oculto establecen base temporal",
    "Formaciones nubosas simétricas captadas en video",
    "Comportamiento errático en fauna local reportado",
    "Desaparición momentánea de suministro eléctrico sin causa técnica",
    "Aparición de símbolos geométricos en campos de cultivo",
    "Relatos de 'tiempo perdido' compartidos en redes sociales",
    "Vibraciones de baja frecuencia perturban el descanso nocturno"
];

const SOURCES = ["Noticias Locales", "El Diario Regional", "Blog de Misterios", "Reporte Ciudadano", "Archivo Histórico"];

// Instantiate providers
const providers = [
    new GNewsProvider(),
    new NewsAPIProvider(),
    new MediastackProvider(),
    new GoogleCustomSearchProvider(),
    new RSSProvider()
];

export async function fetchAreaNews(lat: number, lng: number, config: NewsConfig, passedLocation?: string, passedCountry?: string, passedCountries?: string[]): Promise<NewsItem[]> {
    try {
        let locationName = passedLocation;
        let countryCodes = passedCountries || (passedCountry ? [passedCountry] : []);

        if (!locationName || countryCodes.length === 0) {
            // 1. Reverse Geocode to get location name if missing
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const geoData = await geoRes.json();

            locationName = locationName || geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || geoData.address?.state || "Local";
            if (countryCodes.length === 0) {
                countryCodes = [geoData.address?.country_code || 'pa'];
            }
        }

        const safeLocation = locationName || "Local";

        console.log(`Fetching news for: ${safeLocation} (Countries: ${countryCodes.join(', ')})`);

        // 2. Fetch from all providers for ALL detected countries
        const fetchPromises: Promise<NewsItem[]>[] = [];

        // Multi-country support: if the area spans borders, search in all affected countries
        const targets = countryCodes.length > 0 ? countryCodes : ['pa'];

        // Detect generic location names
        const isGeneric = safeLocation.includes("Zona Analizada") || safeLocation === "Local";

        for (const country of targets) {
            providers.forEach(p => {
                // Broaden keyword to include community/forum context
                // Simplify query syntax for better cross-provider compatibility
                const searchConfig = {
                    ...config,
                    keyword: config.keyword
                        ? `${config.keyword} foro comunidad local`
                        : `foro comunidad local`
                };

                // If location is generic, pass empty string to let providers use country
                const finalLoc = isGeneric ? "" : safeLocation;
                fetchPromises.push(p.fetchNews(lat, lng, finalLoc, country, searchConfig));
            });
        }

        const results = await Promise.all(fetchPromises);

        // 3. Aggregate results and deduplicate by URL
        let allNews: NewsItem[] = results.flat();
        allNews = deduplicateNews(allNews);

        // 4. Smart Blending: If real news < 3 and simulation enabled, blend to reach 5
        if (allNews.length < 3 && config.enableSimulation) {
            console.warn(`Insufficient real news (${allNews.length}). Blending with simulated data.`);
            const simulatedNeeded = 5 - allNews.length;
            const simulated = getSimulatedNews(lat, lng, safeLocation, simulatedNeeded);
            allNews = [...allNews, ...simulated];
        }

        // Sort by date (newest first)
        allNews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return allNews;

    } catch (error) {
        console.error("Error in news aggregation:", error);
        if (config.enableSimulation) {
            return getSimulatedNews(lat, lng, passedLocation || "Unknown");
        }
        return [];
    }
}

function deduplicateNews(items: NewsItem[]): NewsItem[] {
    const seenUrls = new Set<string>();
    return items.filter(item => {
        if (seenUrls.has(item.url)) return false;
        seenUrls.add(item.url);
        return true;
    });
}

function getSimulatedNews(lat: number, lng: number, locationName: string, requestedCount?: number): NewsItem[] {
    // Simulate fetching news based on location
    const seed = Math.abs(lat + lng) * 1000;
    const count = requestedCount || (3 + Math.floor((seed % 3))); // 3 to 5 items if not specified

    const items: NewsItem[] = [];

    for (let i = 0; i < count; i++) {
        const themeIndex = Math.floor((seed + i * 13) % THEMES.length);
        const sourceIndex = Math.floor((seed + i * 7) % SOURCES.length);

        const title = THEMES[themeIndex] + ` en ${locationName}`;
        const query = encodeURIComponent(`${title} ${lat.toFixed(2)} ${lng.toFixed(2)}`);

        items.push({
            title: title,
            source: SOURCES[sourceIndex] + " (Simulado)",
            url: `https://www.google.com/search?q=${query}&tbm=nws`,
            sentiment: i % 2 === 0 ? 'negative' : 'neutral',
            date: new Date(Date.now() - Math.floor((seed + i) % 10) * 86400000).toLocaleDateString(),
            type: 'simulated'
        });
    }

    return items;
}
