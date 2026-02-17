
import type { Entity } from './EntityDatabase';

export interface SocialPost {
    id: string;
    user: string;
    platform: string;
    content: string;
    likes: number;
    url: string;
    sentiment?: string;
    timestamp?: string;
}

interface SearchLink {
    label: string;
    url: string;
    icon: string;
}

export function fetchSocialMedia(_lat: number, _lng: number): SocialPost[] {
    // Mock data for now since we don't have a real social media API
    // In a real app, this would fetch from Twitter/Reddit based on geocode
    return [
        {
            id: 'mock-1',
            user: "@SpiritualWatcher",
            platform: "Twitter",
            content: "Sintiendo mucha energía extraña cerca del parque hoy...",
            likes: 12,
            url: "https://twitter.com/search?q=energia"
        },
        {
            id: 'mock-2',
            user: "u/CityExplorer",
            platform: "Reddit",
            content: "¿Alguien más vio esas luces anoche?",
            likes: 45,
            url: "https://reddit.com/r/ufo"
        }
    ];
}

export const generateOsintLinks = (entity: Entity, locationName: string): SearchLink[] => {
    const queryBase = `"${entity.name}" ${entity.type} "${locationName}"`;
    const encodedQuery = encodeURIComponent(queryBase);

    // Dorks for specific findings
    const historyQuery = encodeURIComponent(`"${entity.name}" AND "historia" AND "${locationName}" BEFORE:2000`);
    const ritualQuery = encodeURIComponent(`"${entity.name}" AND ("ritual" OR "culto") AND "${locationName}"`);

    return [
        {
            label: "Google General",
            url: `https://www.google.com/search?q=${encodedQuery}`,
            icon: "🔍"
        },
        {
            label: "Noticias (Google)",
            url: `https://www.google.com/search?q=${encodedQuery}&tbm=nws`,
            icon: "📰"
        },
        {
            label: "Reportes Históricos",
            url: `https://www.google.com/search?q=${historyQuery}`,
            icon: "📜"
        },
        {
            label: "Actividad Ritual (Dork)",
            url: `https://www.google.com/search?q=${ritualQuery}`,
            icon: "🕯️"
        },
        {
            label: "Twitter/X (Reciente)",
            url: `https://twitter.com/search?q=${encodedQuery}&f=live`,
            icon: "🐦"
        },
        {
            label: "YouTube (Documentales/Vlogs)",
            url: `https://www.youtube.com/results?search_query=${encodedQuery}`,
            icon: "📺"
        }
    ];
};


export const generateDeepForensicsLinks = (locationName: string): SearchLink[] => {
    // Helper to clean and format query
    const q = (text: string) => encodeURIComponent(text);
    const loc = `"${locationName}"`;

    return [
        {
            label: "💀 Crónica Negra (Accidentes/Tragedias)",
            url: `https://www.google.com/search?q=${q(`("accidente fatal" OR "suicido" OR "asesinato" OR "tragedia" OR "muerte extraña") AND ${loc}`)}`,
            icon: "💀"
        },
        {
            label: "⚔️ Historial de Conflicto (Batallas)",
            url: `https://www.google.com/search?q=${q(`("batalla" OR "guerra" OR "masacre" OR "cementerio antiguo") AND ${loc} BEFORE:2000`)}`,
            icon: "⚔️"
        },
        {
            label: "👻 Fenómenos y Apariciones",
            url: `https://www.google.com/search?q=${q(`("fantasmas" OR "apariciones" OR "luces extrañas" OR "ovni" OR "llorona") AND ${loc}`)}`,
            icon: "👻"
        },
        {
            label: "🏛️ Arqueología y Ruinas",
            url: `https://www.google.com/search?q=${q(`("ruinas" OR "sitio arqueológico" OR "tumbas" OR "leyenda indigena") AND ${loc}`)}`,
            icon: "🏛️"
        },
        {
            label: "📰 Noticias de Sucesos (Recientes)",
            url: `https://www.google.com/search?q=${q(`("sucesos" OR "policiales") AND ${loc}`)}&tbm=nws`,
            icon: "🚨"
        },
        {
            label: "🕯️ Sectas y Rituales",
            url: `https://www.google.com/search?q=${q(`("secta" OR "ritual" OR "culto" OR "sacrificio") AND ${loc}`)}`,
            icon: "🕯️"
        }
    ];
};
