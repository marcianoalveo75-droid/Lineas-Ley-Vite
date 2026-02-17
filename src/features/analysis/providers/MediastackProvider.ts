import type { NewsItem } from '../types';
import type { NewsConfig, NewsProvider } from './NewsProvider';

export class MediastackProvider implements NewsProvider {
    name = 'Mediastack';

    async fetchNews(_lat: number, _lng: number, locationName: string, countryCode: string = 'pa', config?: NewsConfig): Promise<NewsItem[]> {
        const apiKey = config?.mediastackApiKey;

        if (!apiKey) {
            return [];
        }

        try {
            // Mediastack query construction
            // Free plan limits: no https (depends on account), keywords, countries, languages.
            const query = encodeURIComponent(locationName || countryCode);
            const countries = countryCode.toLowerCase();
            const language = 'es';

            const url = `http://api.mediastack.com/v1/news?access_key=${apiKey}&keywords=${query}&countries=${countries}&languages=${language}&limit=25`;

            const response = await fetch(url);
            const data = await response.json();

            if (data && data.data) {
                return data.data.map((article: any) => {
                    // Sentiment analysis (simple keyword based for now)
                    const title = article.title.toLowerCase();
                    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
                    if (title.includes('crimen') || title.includes('accidente') || title.includes('muerte')) {
                        sentiment = 'negative';
                    }

                    return {
                        title: article.title,
                        source: article.source || 'Mediastack',
                        url: article.url,
                        sentiment,
                        date: article.published_at || new Date().toISOString(),
                        type: 'news'
                    };
                });
            }

            return [];
        } catch (error) {
            console.error("Mediastack fetch error:", error);
            return [];
        }
    }
}
