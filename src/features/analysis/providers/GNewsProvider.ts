import type { NewsProvider } from './NewsProvider';
import type { NewsItem } from '../types';

// TODO: User must provide this key
const API_KEY = '65b75641f56247449a3df303217fba79'; // Keeping the existing one for now as placeholder

export class GNewsProvider implements NewsProvider {
    name = 'GNews API';

    async fetchNews(_lat: number, _lng: number, locationName: string, countryCode: string = 'us', config?: any): Promise<NewsItem[]> {
        try {
            const apiKey = config?.gnewsApiKey || API_KEY;

            // If simulation is disabled and no key provided, return empty
            if (!config?.enableSimulation && !config?.gnewsApiKey && !API_KEY) {
                console.warn("GNews API Key missing and simulation disabled");
                return [];
            }

            const hasLocation = locationName && !locationName.includes("Zona Analizada");
            const topCountry = countryCode.toUpperCase();

            let queryStr = "";
            if (hasLocation) {
                queryStr = `"${locationName}" "${topCountry}"`;
            } else {
                queryStr = `"${topCountry}"`;
            }

            if (config?.keyword) {
                queryStr = `${config.keyword} AND ${queryStr}`;
            }
            const query = encodeURIComponent(queryStr);

            // Use country code if available, ensuring it's 2 letters lowercase
            const countryParam = countryCode ? countryCode.toLowerCase() : 'us';
            let url = `https://gnews.io/api/v4/search?q=${query}&lang=es&country=${countryParam}&max=10&apikey=${apiKey}`;

            if (config?.dateFrom) url += `&from=${new Date(config.dateFrom).toISOString()}`;
            if (config?.dateTo) url += `&to=${new Date(config.dateTo).toISOString()}`;


            const response = await fetch(url);
            const data = await response.json();

            if (data.articles) {
                return data.articles.map((article: any) => ({
                    title: article.title,
                    source: article.source.name,
                    url: article.url,
                    sentiment: 'neutral',
                    date: new Date(article.publishedAt).toLocaleDateString()
                }));
            }
            return [];
        } catch (error) {
            console.error('GNews API error:', error);
            return [];
        }
    }
}
