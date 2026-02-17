export interface NewsItem {
    title: string;
    source: string;
    url: string;
    sentiment: 'positive' | 'negative' | 'neutral' | 'high_tension' | 'medium_tension';
    date: string;
    type?: 'news' | 'osint' | 'simulated';
    description?: string;
}
