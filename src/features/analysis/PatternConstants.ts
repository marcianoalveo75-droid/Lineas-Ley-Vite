export const PATTERN_COLORS: Record<string, string> = {
    'Triángulo de Poder': '#FF6B6B', // Red
    'Intersección': '#4EA1FF',       // Blue
    'Nodo de Convergencia': '#C56BFF',// Purple (Hub)
    'Alineamiento Celeste': '#FFD93D',// Gold/Yellow
    'Corredor de Energía': '#00C176', // Green
    'Info': '#888888',
    'Unknown': '#CCCCCC'
};

export const PATTERN_STYLES = {
    'Triángulo de Poder': { shape: 'triangle', radius: 10 },
    'Intersección': { shape: 'circle', radius: 5 },
    'Nodo de Convergencia': { shape: 'star', radius: 15 },
    'Alineamiento Celeste': { shape: 'line', radius: 8 },
    'Corredor de Energía': { shape: 'rect', radius: 8 }
};
