import type { NewsItem } from '../types';

export interface NewsConfig {
    enableSimulation: boolean;
    gnewsApiKey: string;
    newsApiKey: string;
    apiTubeApiKey: string;
    mediastackApiKey?: string;
    googleSearchApiKey: string;
    googleSearchEngineId: string;
    keyword?: string;
    extraKeywords?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface NewsProvider {
    name: string;
    fetchNews(lat: number, lng: number, locationName: string, countryCode?: string, config?: NewsConfig): Promise<NewsItem[]>;
}
