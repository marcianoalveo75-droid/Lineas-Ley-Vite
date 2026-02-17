import type { NewsProvider } from './NewsProvider';
import type { NewsItem } from '../types';

export class NewsAPIProvider implements NewsProvider {
    name = 'NewsAPI.org';

    async fetchNews(_lat: number, _lng: number, locationName: string, countryCode: string = 'us', config?: any): Promise<NewsItem[]> {
        const apiKey = config?.newsApiKey;

        if (!apiKey) {
            // Silently fail if no key is provided, as it's optional
            return [];
        }

        try {
            // NewsAPI.org /v2/everything is better for specific locations than /top-headlines
            // Query logic: Broaden search to ensure results
            const hasLocation = locationName && !locationName.includes("Zona Analizada");
            const topCountry = countryCode.toUpperCase();

            let queryStr = "";
            if (hasLocation) {
                queryStr = `"${locationName}" "${topCountry}"`;
            } else {
                queryStr = `"${topCountry}"`;
            }

            if (config?.keyword) {
                queryStr = `(${config.keyword}) AND ${queryStr}`;
            }
            const query = encodeURIComponent(queryStr);

            // Note: the 'from' date could be dynamic
            let fromDate = "";
            if (config?.dateFrom) {
                fromDate = config.dateFrom;
            } else {
                const today = new Date();
                const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                fromDate = lastWeek.toISOString().split('T')[0];
            }

            let url = `https://newsapi.org/v2/everything?q=${query}&from=${fromDate}&sortBy=relevance&language=es&apiKey=${apiKey}`;
            if (config?.dateTo) url += `&to=${config.dateTo}`;

            console.log("NewsAPI Fetch URL:", url.replace(apiKey, 'REDACTED_KEY'));

            const response = await fetch(url);

            // Handle the specific error for localhost restriction
            if (response.status === 426) {
                console.warn("NewsAPI.org Upgrade Required (Rate Limit or Plan restriction). Free plan only works on localhost.");
                return [];
            }

            if (!response.ok) {
                throw new Error(`NewsAPI status: ${response.status}`);
            }

            const data = await response.json();

            if (data.articles) {
                return data.articles.map((article: any) => ({
                    title: article.title,
                    source: article.source.name || 'NewsAPI',
                    url: article.url,
                    sentiment: 'neutral',
                    date: article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : new Date().toLocaleDateString()
                }));
            }
            return [];
        } catch (error) {
            console.error('NewsAPI.org error:', error);
            return [];
        }
    }
}
