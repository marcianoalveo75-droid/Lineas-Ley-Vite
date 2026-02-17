import type { NewsProvider } from './NewsProvider';
import type { NewsItem } from '../types';

export class RSSProvider implements NewsProvider {
    name = 'RSS Feed';

    private COUNTRY_MAP: { [key: string]: string } = {
        "pa": "Panamá",
        "es": "España",
        "mx": "México",
        "ar": "Argentina",
        "co": "Colombia",
        "cl": "Chile",
        "pe": "Perú",
        "ve": "Venezuela",
        "ec": "Ecuador",
        "gt": "Guatemala",
        "us": "Estados Unidos"
    };

    async fetchNews(_lat: number, _lng: number, locationName: string, countryCode: string = 'pa', config?: any): Promise<NewsItem[]> {
        const items: NewsItem[] = [];

        try {
            const hasLocation = locationName && !locationName.includes("Zona Analizada");
            const countryFilter = this.COUNTRY_MAP[countryCode.toLowerCase()] || countryCode;

            let queryStr = "";
            if (hasLocation) {
                queryStr = `"${locationName}" "${countryFilter}"`;
            } else {
                queryStr = `"${countryFilter}"`;
            }

            if (config?.keyword) {
                queryStr = `${config.keyword} AND ${queryStr}`;
            }

            const query = encodeURIComponent(queryStr);

            const gl = countryCode.toUpperCase();
            const hl = countryCode.toLowerCase() === 'us' ? 'en' : 'es-419';
            const ceid = `${gl}:${hl}`;

            const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
            console.log(`Buscando noticias en Google RSS: ${rssUrl}`);
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;

            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (!data.contents) return [];

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data.contents, "text/xml");
            const channelItems = xmlDoc.querySelectorAll("item");

            channelItems.forEach(item => {
                const title = item.querySelector("title")?.textContent;
                const link = item.querySelector("link")?.textContent;
                const pubDate = item.querySelector("pubDate")?.textContent;
                const source = item.querySelector("source")?.textContent || "Google News";

                if (title && link) {
                    items.push({
                        title: title,
                        source: source,
                        url: link,
                        sentiment: 'neutral', // Analyzed later
                        date: pubDate ? new Date(pubDate).toLocaleDateString() : new Date().toLocaleDateString()
                    });
                }
            });

            // Limit to top 5 unrelated to prevent flooding
            return items.slice(0, 5);

        } catch (err) {
            console.warn(`Failed to fetch Google RSS feed`, err);
            return [];
        }
    }
}
