import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ConfigState {
    enableSimulation: boolean;
    gnewsApiKey: string;
    newsApiKey: string;
    apiTubeApiKey: string;
    mediastackApiKey: string;
    googleSearchApiKey: string;
    googleSearchEngineId: string;
    agentName: string;
    language: 'es' | 'en';
}

// Load initial state from localStorage if available
const loadState = (): ConfigState => {
    try {
        const serialized = localStorage.getItem('appConfig');
        if (serialized) {
            const state = JSON.parse(serialized);
            // Migrate: Ensure language exists if loading old state
            if (!state.language) state.language = 'es';
            return state;
        }
    } catch (e) {
        console.warn("Failed to load config from localStorage", e);
    }

    try {
        const env = import.meta.env || {};
        return {
            enableSimulation: false,
            gnewsApiKey: env.VITE_GNEWS_API_KEY || '',
            newsApiKey: env.VITE_NEWS_API_KEY || '65b75641f56247449a3df303217fba79',
            apiTubeApiKey: env.VITE_APITUBE_API_KEY || 'api_live_xo2dQuS9qlRzMmKbewT6uI3JvrCX03Fu2NXkAraC',
            mediastackApiKey: env.VITE_MEDIASTACK_API_KEY || '',
            googleSearchApiKey: env.VITE_GOOGLE_SEARCH_API_KEY || '',
            googleSearchEngineId: env.VITE_GOOGLE_SEARCH_ENGINE_ID || '',
            agentName: 'Observer_01',
            language: 'es'
        };
    } catch (e) {
        console.error("CRITICAL: Failed to load env vars", e);
        return {
            enableSimulation: false,
            gnewsApiKey: '',
            newsApiKey: '65b75641f56247449a3df303217fba79',
            apiTubeApiKey: 'api_live_xo2dQuS9qlRzMmKbewT6uI3JvrCX03Fu2NXkAraC',
            mediastackApiKey: '',
            googleSearchApiKey: '',
            googleSearchEngineId: '',
            agentName: 'Observer_01',
            language: 'es'
        };
    }
};




const initialState: ConfigState = loadState();

const configSlice = createSlice({
    name: 'config',
    initialState,
    reducers: {
        setSimulationMode: (state, action: PayloadAction<boolean>) => {
            state.enableSimulation = action.payload;
            saveState(state);
        },
        setGNewsApiKey: (state, action: PayloadAction<string>) => {
            state.gnewsApiKey = action.payload;
            saveState(state);
        },
        setNewsApiKey: (state, action: PayloadAction<string>) => {
            state.newsApiKey = action.payload;
            saveState(state);
        },
        setApiTubeApiKey: (state, action: PayloadAction<string>) => {
            state.apiTubeApiKey = action.payload;
            saveState(state);
        },
        setMediastackApiKey: (state, action: PayloadAction<string>) => {
            state.mediastackApiKey = action.payload;
            saveState(state);
        },
        setGoogleSearchApiKey: (state, action: PayloadAction<string>) => {
            state.googleSearchApiKey = action.payload;
            saveState(state);
        },
        setGoogleSearchEngineId: (state, action: PayloadAction<string>) => {
            state.googleSearchEngineId = action.payload;
            saveState(state);
        },
        updateConfig: (state, action: PayloadAction<Partial<ConfigState>>) => {
            Object.assign(state, action.payload);
            saveState(state);
        },
        setAgentName: (state, action: PayloadAction<string>) => {
            state.agentName = action.payload;
            saveState(state);
        },
        setLanguage: (state, action: PayloadAction<'es' | 'en'>) => {
            state.language = action.payload;
            saveState(state);
        }
    }
});

// Helper to save state
const saveState = (state: ConfigState) => {
    try {
        localStorage.setItem('appConfig', JSON.stringify(state));
    } catch (e) {
        console.warn("Failed to save config to localStorage", e);
    }
};

export const {
    setSimulationMode,
    setGNewsApiKey,
    setNewsApiKey,
    setApiTubeApiKey,
    setMediastackApiKey,
    setGoogleSearchApiKey,
    setGoogleSearchEngineId,
    updateConfig,
    setAgentName,
    setLanguage
} = configSlice.actions;

export default configSlice.reducer;
