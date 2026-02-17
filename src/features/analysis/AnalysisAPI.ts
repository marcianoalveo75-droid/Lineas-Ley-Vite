export interface BackendAnalysisResponse {
    indices: {
        chaos: number;
        despair: number;
        oppression: number;
        intensity: number;
    };
    dominant_influence: string;
    detected_entities: any[]; // Matches backend Entity model
    environmental_context: {
        weather: any;
        quakes: number;
        quake_details: any[]; // Specific seismic events
        moon?: {
            name: string;
            illumination: number;
            sentiment: string;
            position: number;
        };
    };
    news_context: {
        negative_articles: number;
        articles: any[];
    };
    collective_field?: {
        scores: Record<string, number>;
        dominant: string;
        density_index: number;
    };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function fetchRemoteAnalysis(
    lat: number,
    lng: number,
    locationName: string,
    countryCode: string,
    apiKey: string,
    mediastackApiKey?: string,
    keyword?: string,
    extraKeywords?: string,
    dateFrom?: string,
    dateTo?: string,
    countryCodes?: string[]
): Promise<BackendAnalysisResponse | null> {
    try {
        const payload = {
            lat,
            lon: lng,
            location_name: locationName,
            country_code: countryCode,
            country_codes: countryCodes || [countryCode],
            news_api_key: apiKey,
            mediastack_api_key: mediastackApiKey,
            keyword,
            extra_keywords: extraKeywords,
            date_from: dateFrom,
            date_to: dateTo
        };

        console.log("DEBUG: Sending Analysis Payload:", {
            location_name: locationName,
            country_code: countryCode,
            country_codes: countryCodes
        });

        const response = await fetch(`${API_BASE_URL}/analysis/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error(`Backend Analysis Failed: ${response.status} ${response.statusText}`);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Network error connecting to Backend Analysis:", error);
        return null;
    }
}

export interface CollectiveAnalysisResponse {
    status: string;
    data: {
        scores: Record<string, number>;
        dominant: string;
        total_analyzed: number;
        density_index: number;
    };
    sources_count: number;
}

export async function fetchCollectiveField(): Promise<CollectiveAnalysisResponse | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/analysis/collective-field`);
        if (!response.ok) {
            console.error(`Collective Analysis Failed: ${response.status}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error("Network error connecting to Backend Collective Analysis:", error);
        return null;
    }
}
