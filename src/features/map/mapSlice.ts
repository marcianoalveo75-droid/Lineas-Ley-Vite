import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AnalysisResult } from '../analysis/PatternDetector';

export interface MarkerData {
    id: number;
    lat: number;
    lng: number;
    name: string;
    description?: string;
    image?: string;
}

export interface LeyLine {
    id: number;
    name: string;
    color: string;
    markers: MarkerData[];
}

interface MapState {
    activeMarkers: MarkerData[];
    leyLines: LeyLine[];
    drawMode: boolean;
    selectedLayer: string;
    activeOverlays: string[];
    analysisBounds: [[number, number], [number, number]] | null;
    analysisMode: 'none' | 'box';
    showHeatmap: boolean;
    analysisResult: AnalysisResult | null;
    editingMarkerId: number | null;
    mapView: { center: [number, number]; zoom: number } | null;
}

const initialState: MapState = {
    activeMarkers: [],
    leyLines: [],
    drawMode: false,
    selectedLayer: 'street',
    activeOverlays: [],
    analysisBounds: null,
    analysisMode: 'none',
    showHeatmap: false,
    analysisResult: null,
    editingMarkerId: null,
    mapView: null,
};

export const mapSlice = createSlice({
    name: 'map',
    initialState,
    reducers: {
        setShowHeatmap: (state, action: PayloadAction<boolean>) => {
            state.showHeatmap = action.payload;
        },
        setAnalysisMode: (state, action: PayloadAction<'none' | 'box'>) => {
            state.analysisMode = action.payload;
        },
        setAnalysisBounds: (state, action: PayloadAction<[[number, number], [number, number]] | null>) => {
            state.analysisBounds = action.payload;
        },
        setSelectedLayer: (state, action: PayloadAction<string>) => {
            state.selectedLayer = action.payload;
        },
        toggleOverlay: (state, action: PayloadAction<string>) => {
            const overlayId = action.payload;
            if (state.activeOverlays.includes(overlayId)) {
                state.activeOverlays = state.activeOverlays.filter(id => id !== overlayId);
            } else {
                state.activeOverlays.push(overlayId);
            }
        },
        setDrawMode: (state, action: PayloadAction<boolean>) => {
            state.drawMode = action.payload;
        },
        addActiveMarker: (state, action: PayloadAction<MarkerData>) => {
            state.activeMarkers.push(action.payload);
        },
        updateActiveMarker: (state, action: PayloadAction<MarkerData>) => {
            const index = state.activeMarkers.findIndex(m => m.id === action.payload.id);
            if (index !== -1) {
                state.activeMarkers[index] = action.payload;
            }
        },
        removeActiveMarker: (state, action: PayloadAction<number>) => {
            state.activeMarkers = state.activeMarkers.filter(m => m.id !== action.payload);
        },
        clearActiveMarkers: (state) => {
            state.activeMarkers = [];
        },
        setActiveMarkers: (state, action: PayloadAction<MarkerData[]>) => {
            state.activeMarkers = action.payload;
        },
        addLeyLine: (state, action: PayloadAction<LeyLine>) => {
            state.leyLines.push(action.payload);
        },
        updateLeyLine: (state, action: PayloadAction<LeyLine>) => {
            const index = state.leyLines.findIndex(l => l.id === action.payload.id);
            if (index !== -1) {
                state.leyLines[index] = action.payload;
            }
        },
        deleteLeyLine: (state, action: PayloadAction<number>) => {
            state.leyLines = state.leyLines.filter(l => l.id !== action.payload);
        },
        setLeyLines: (state, action: PayloadAction<LeyLine[]>) => {
            state.leyLines = action.payload;
        },
        resetMap: (state) => {
            state.activeMarkers = [];
            state.leyLines = [];
        },
        setEditingMarkerId: (state, action: PayloadAction<number | null>) => {
            state.editingMarkerId = action.payload;
        },
        setMapView: (state, action: PayloadAction<{ center: [number, number]; zoom: number } | null>) => {
            state.mapView = action.payload;
        },
        setAnalysisResult: (state, action: PayloadAction<AnalysisResult | null>) => {
            state.analysisResult = action.payload;
        },
    },
});

export const {
    setSelectedLayer,
    toggleOverlay,
    setDrawMode,
    setAnalysisMode,
    setAnalysisBounds,
    setShowHeatmap,
    addActiveMarker,
    updateActiveMarker,
    removeActiveMarker,
    clearActiveMarkers,
    setActiveMarkers,
    addLeyLine,
    updateLeyLine,
    deleteLeyLine,
    setLeyLines,
    resetMap,
    setEditingMarkerId,
    setMapView,
    setAnalysisResult
} = mapSlice.actions;

export default mapSlice.reducer;
