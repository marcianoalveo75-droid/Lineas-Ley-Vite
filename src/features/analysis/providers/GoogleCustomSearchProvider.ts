import type { NewsProvider } from './NewsProvider';
import type { NewsItem } from '../types';

// These should be configured by the user in a settings menu
const GOOGLE_API_KEY = ''; // User needs to provide
const SEARCH_ENGINE_ID = ''; // User needs to provide

export class GoogleCustomSearchProvider implements NewsProvider {
    name = 'Google Custom Search';

    async fetchNews(_lat: number, _lng: number, locationName: string, countryCode?: string, config?: any): Promise<NewsItem[]> {
        const apiKey = config?.googleSearchApiKey || GOOGLE_API_KEY;
        const cx = config?.googleSearchEngineId || SEARCH_ENGINE_ID;

        if (!apiKey || !cx) {
            console.warn('Google Custom Search credentials missing');
            return [];
        }

        try {
            // Contextualize search: if location is generic, use country name instead
            const hasLocation = locationName && !locationName.includes("Zona Analizada");
            const topCountry = countryCode || 'pa';

            let queryStr = hasLocation ? `"${locationName}" "${topCountry}"` : `"${topCountry}"`;

            if (config?.keyword) {
                queryStr = `${config.keyword} ${queryStr}`;
            }

            const query = encodeURIComponent(`${queryStr} news`);
            const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&dateRestrict=d7`; // Last 7 days

            const response = await fetch(url);
            const data = await response.json();

            if (data.items) {
                return data.items.map((item: any) => ({
                    title: item.title,
                    source: item.displayLink || 'Google Search',
                    url: item.link,
                    sentiment: 'neutral',
                    date: new Date().toLocaleDateString() // PSE doesn't always give clean dates, defaulting to now
                }));
            }
            return [];
        } catch (error) {
            console.error('Google Custom Search error:', error);
            return [];
        }
    }
}
