import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
    setDrawMode,
    resetMap,
    updateActiveMarker,
    removeActiveMarker,
    addLeyLine,
    updateLeyLine,
    deleteLeyLine,
    setAnalysisMode,
    setShowHeatmap,
    setEditingMarkerId,
    setMapView,
    setSelectedLayer,
    type LeyLine
} from '../features/map/mapSlice';
import {
    setSimulationMode,
    setLanguage,
    setGNewsApiKey,
    setNewsApiKey,
    setMediastackApiKey,
    setGoogleSearchApiKey,
    setGoogleSearchEngineId
} from '../features/config/configSlice';
import { detectPatterns, type AnalysisResult } from '../features/analysis/PatternDetector';
import { searchEntities, type Entity } from '../features/analysis/EntityDatabase';
import { generateReport } from '../features/analysis/ReportGenerator';
import AnalysisCharts from '../features/analysis/AnalysisCharts';
import { kml } from "@mapbox/togeojson";
import tokml from "tokml";
import JSZip from "jszip";
import './UnifiedMenu.css';

const TEXTS = {
    es: {
        map: "MAPA",
        analysis: "ANÁLISIS",
        search: "BÚSQUEDA",
        system: "SISTEMA",
        tools: "Herramientas de Dibujo",
        startDraw: "✏️ MODO DIBUJO",
        stopDraw: "🛑 DETENER DIBUJO",
        saveLine: "💾 GUARDAR LÍNEA",
        dataTools: "Gestión de Datos",
        loadFile: "📂 CARGAR (KMZ/JSON)",
        exportFile: "💾 EXPORTAR (KMZ)",
        clearMap: "🗑️ LIMPIAR MAPA",
        mapTypes: "Tipos de Mapa",
        streetView: "👀 Street View",
        cams: "📹 Cámaras",
        analysisControls: "Controles de Análisis",
        defineArea: "📐 DEFINIR ÁREA",
        cancelArea: "🛑 CANCELAR ÁREA",
        showHeatmap: "🔥 VER HEATMAP",
        hideHeatmap: "🔥 OCULTAR HEATMAP",
        process: "Procesamiento",
        detectPatterns: "🔍 DETECTAR PATRONES",
        searchEntities: "👹 BUSCAR ENTIDADES",
        genReport: "📄 GENERAR INFORME",
        news: "📰 Noticias Relacionadas",
        social: "💬 Redes Sociales",
        config: "Configuración",
        simulation: "Simulación Habilitada",
        language: "Idioma / Language",
        importSuccess: "Archivo importado correctamente.",
        importError: "Error leyendo archivo.",
        confirmClear: "¿Limpiar líneas y marcadores?",
        minPoints: "Añade al menos 2 puntos para guardar una línea ley.",
        savedLines: "Líneas Guardadas",
        activePoints: "Puntos Activos",
        editMarker: "Editar Marcador",
        save: "GUARDAR",
        cancel: "CANCELAR",
        name: "Nombre",
        desc: "Descripción",
        image: "Imagen",
        searchPlaceholder: "Ciudad, País o Lat,Lng",
        noResults: "Sin resultados"
    },
    en: {
        map: "MAP",
        analysis: "ANALYSIS",
        search: "SEARCH",
        system: "SYSTEM",
        tools: "Drawing Tools",
        startDraw: "✏️ DRAW MODE",
        stopDraw: "🛑 STOP DRAWING",
        saveLine: "💾 SAVE LINE",
        dataTools: "Data Management",
        loadFile: "📂 LOAD (KMZ/JSON)",
        exportFile: "💾 EXPORT (KMZ)",
        clearMap: "🗑️ CLEAR MAP",
        mapTypes: "Map Types",
        streetView: "👀 Street View",
        cams: "📹 Webcams",
        analysisControls: "Analysis Controls",
        defineArea: "📐 DEFINE AREA",
        cancelArea: "🛑 CANCEL AREA",
        showHeatmap: "🔥 SHOW HEATMAP",
        hideHeatmap: "🔥 HIDE HEATMAP",
        process: "Processing",
        detectPatterns: "🔍 DETECT PATTERNS",
        searchEntities: "👹 SEARCH ENTITIES",
        genReport: "📄 GENERATE REPORT",
        news: "📰 Related News",
        social: "💬 Social Feed",
        config: "Configuration",
        simulation: "Simulation Enabled",
        language: "Language / Idioma",
        importSuccess: "File imported successfully.",
        importError: "Error reading file.",
        confirmClear: "Clear all lines and markers?",
        minPoints: "Add at least 2 points to save a Ley Line.",
        savedLines: "Saved Lines",
        activePoints: "Active Points",
        editMarker: "Edit Marker",
        save: "SAVE",
        cancel: "CANCEL",
        name: "Name",
        desc: "Description",
        image: "Image",
        searchPlaceholder: "City, Country or Lat,Lng",
        noResults: "No results"
    }
};

export default function UnifiedMenu() {
    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'map' | 'analysis' | 'system' | 'search'>('map');
    const dispatch = useAppDispatch();

    // Map State
    const { activeMarkers, leyLines, drawMode, analysisMode, analysisBounds, showHeatmap, editingMarkerId, selectedLayer } = useAppSelector((state) => state.map);

    // Config State
    // @ts-ignore
    const { enableSimulation, gnewsApiKey, newsApiKey, apiTubeApiKey, googleSearchApiKey, googleSearchEngineId, language } = useAppSelector((state) => state.config);

    const T = TEXTS[language as 'es' | 'en'] || TEXTS.es;

    // Analysis State
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [entities, setEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    // Marker Edit Local Form State
    const [editForm, setEditForm] = useState<{ name: string; description: string; image: string }>({ name: '', description: '', image: '' });

    // Effect to populate form when editingMarkerId changes from Redux
    useEffect(() => {
        if (editingMarkerId !== null) {
            let marker = activeMarkers.find((m) => m.id === editingMarkerId);
            if (!marker) {
                // Search in leyLines
                for (const line of leyLines) {
                    const m = line.markers.find(mk => mk.id === editingMarkerId);
                    if (m) {
                        marker = m;
                        break;
                    }
                }
            }

            if (marker) {
                setEditForm({
                    name: marker.name || '',
                    description: marker.description || '',
                    image: marker.image || ''
                });
            }
        } else {
            // Reset form when editing is cancelled
            setEditForm({ name: '', description: '', image: '' });
        }
    }, [editingMarkerId, activeMarkers, leyLines]);

    // --- ACTIONS ---

    // Map Actions
    const handleSaveLeyLine = () => {
        if (activeMarkers.length < 2) {
            alert(T.minPoints);
            return;
        }
        const newLine: LeyLine = {
            id: Date.now(),
            name: `Línea ${leyLines.length + 1}`,
            color: "#00f0ff", // Default sci-fi cyan
            markers: [...activeMarkers],
        };
        dispatch(addLeyLine(newLine));
        dispatch({ type: 'map/clearActiveMarkers' });
    };

    const startEditingMarker = (id: number) => {
        const marker = activeMarkers.find((m) => m.id === id);
        if (!marker) return;
        setEditForm({
            name: marker.name || '',
            description: marker.description || '',
            image: marker.image || ''
        });
        dispatch(setEditingMarkerId(id));
    };

    const handleSaveMarkerEdit = () => {
        if (editingMarkerId === null) return;

        // Check active markers
        const activeMarker = activeMarkers.find((m) => m.id === editingMarkerId);
        if (activeMarker) {
            dispatch(updateActiveMarker({
                ...activeMarker,
                name: editForm.name,
                description: editForm.description,
                image: editForm.image
            }));
        } else {
            // Check leyLines
            const line = leyLines.find(l => l.markers.some(m => m.id === editingMarkerId));
            if (line) {
                const updatedMarkers = line.markers.map(m =>
                    m.id === editingMarkerId
                        ? { ...m, name: editForm.name, description: editForm.description, image: editForm.image }
                        : m
                );
                dispatch(updateLeyLine({ ...line, markers: updatedMarkers }));
            }
        }

        dispatch(setEditingMarkerId(null));
        setEditForm({ name: '', description: '', image: '' }); // Reset form
    };

    const handleCancelEdit = () => {
        dispatch(setEditingMarkerId(null));
        setEditForm({ name: '', description: '', image: '' });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditForm(prev => ({ ...prev, image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    // File Import Logic
    const processGeoJSON = (json: any) => {
        if (json.type === "FeatureCollection") {
            const newLines: LeyLine[] = [];
            const extraMarkers: any[] = [];
            json.features.forEach((feat: any) => {
                const geom = feat.geometry;
                if (!geom) return;
                if (geom.type === "LineString") {
                    const pts = geom.coordinates.map((c: number[]) => ({ id: Date.now() + Math.floor(Math.random() * 100000), lat: c[1], lng: c[0], name: feat.properties?.name || "Imported" }));
                    newLines.push({ id: Date.now() + Math.floor(Math.random() * 1000), name: feat.properties?.name || "Imported line", color: "#00f0ff", markers: pts });
                } else if (geom.type === "Point") {
                    const c = geom.coordinates;
                    extraMarkers.push({
                        id: Date.now() + Math.floor(Math.random() * 100000),
                        lat: c[1],
                        lng: c[0],
                        name: feat.properties?.name || "Imported point",
                        description: feat.properties?.description
                    });
                }
            });
            if (newLines.length) dispatch(addLeyLine(newLines[0]));
            newLines.forEach(l => dispatch(addLeyLine(l)));

            if (extraMarkers.length) {
                extraMarkers.forEach(m => dispatch(updateActiveMarker(m) as any || dispatch({ type: 'map/addActiveMarker', payload: m })));
            }
            alert(T.importSuccess);
        } else {
            alert(T.importError);
        }
    };

    const handleLoadFile = async (file: File | null) => {
        if (!file) return;
        try {
            const name = file.name.toLowerCase();
            if (name.endsWith(".geojson") || name.endsWith(".json")) {
                const text = await file.text();
                processGeoJSON(JSON.parse(text));
            } else if (name.endsWith(".kml")) {
                const text = await file.text();
                const parser = new DOMParser();
                const xml = parser.parseFromString(text, "text/xml");
                const geojson = kml(xml);
                processGeoJSON(geojson);
            } else if (name.endsWith(".kmz")) {
                const zip = await JSZip.loadAsync(file);
                let kmlText = "";
                for (const filename in zip.files) {
                    if (filename.toLowerCase().endsWith(".kml")) {
                        kmlText = await zip.files[filename].async("string");
                        break;
                    }
                }
                if (kmlText) {
                    const parser = new DOMParser();
                    const xml = parser.parseFromString(kmlText, "text/xml");
                    const geojson = kml(xml);
                    processGeoJSON(geojson);
                } else {
                    alert(T.importError);
                }
            } else {
                alert(T.importError);
            }
        } catch (err) {
            console.error(err);
            alert(T.importError);
        }
    };

    // Analysis Actions
    const handleDetectPatterns = async () => {
        if (!analysisBounds) return;
        setLoading(true);
        try {
            const config = { enableSimulation, gnewsApiKey, newsApiKey, apiTubeApiKey, googleSearchApiKey, googleSearchEngineId };
            const result = await detectPatterns(leyLines, analysisBounds, config, activeMarkers);
            setAnalysisResult(result);
        } catch (error) {
            console.error("Analysis error:", error);
            alert("Error");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchEntities = () => {
        if (!analysisBounds) return;
        setLoading(true);
        setTimeout(async () => {
            const results = await searchEntities(analysisBounds);
            setEntities(results);
            setLoading(false);
        }, 1500);
    };

    const handleGenerateReport = () => {
        if (analysisResult) {
            generateReport(
                analysisResult.patterns,
                entities,
                analysisResult.news,
                analysisBounds,
                activeMarkers,
                leyLines,
                analysisResult.diagnosis,
                analysisResult.dateRange
            );
        }
    };

    // Search Actions
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearchLoading(true);
        setSearchResults([]);

        const coordMatch = searchQuery.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
        if (coordMatch) {
            const lat = parseFloat(coordMatch[1]);
            const lng = parseFloat(coordMatch[3]);
            dispatch(setMapView({ center: [lat, lng], zoom: 15 }));
            setSearchLoading(false);
            return;
        }

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error("Search error:", error);
            alert(T.noResults);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSelectLocation = (lat: string, lng: string) => {
        dispatch(setMapView({ center: [parseFloat(lat), parseFloat(lng)], zoom: 13 }));
    };

    // System Actions
    const handleClear = () => {
        if (!confirm(T.confirmClear)) return;
        dispatch(resetMap());
    };

    const handleExport = async () => {
        const fc: any = { type: "FeatureCollection", features: [] };
        leyLines.forEach((line) => {
            fc.features.push({
                type: "Feature",
                properties: { name: line.name, color: line.color, category: "leyline" },
                geometry: { type: "LineString", coordinates: line.markers.map((m) => [m.lng, m.lat]) },
            });
        });
        activeMarkers.forEach((m) => {
            fc.features.push({
                type: "Feature",
                properties: { name: m.name, description: m.description, image: m.image },
                geometry: { type: "Point", coordinates: [m.lng, m.lat] },
            });
        });

        // @ts-ignore
        const kml = tokml(fc, { name: "Líneas Ley", documentName: "Líneas Ley" });
        const zip = new JSZip();
        zip.file("doc.kml", kml);
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "leylines_export.kmz";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).classList.contains('unified-menu-container')) {
            setIsOpen(false);
        }
    };

    return (
        <div
            className={`unified-menu-container ${isOpen ? 'open' : ''}`}
            onClick={handleOverlayClick}
        >
            <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12h18M3 6h18M3 18h18" />
                    </svg>
                )}
            </button>

            <div className="menu-panel">
                <div className="menu-header">
                    <h1 className="menu-title">LEY LINES</h1>
                    <div className="menu-subtitle">Tactical Explorer v2.0</div>
                </div>

                <div className="menu-tabs">
                    <button className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>{T.map}</button>
                    <button className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>{T.analysis}</button>
                    <button className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>{T.search}</button>
                    <button className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>{T.system}</button>
                </div>

                <div className="menu-content">
                    {/* MAP TAB */}
                    {activeTab === 'map' && (
                        <>
                            {/* MOVED TOOLS TO TOP */}
                            <div className="sci-fi-section">
                                <div className="section-title">{T.tools}</div>
                                <button
                                    className={`sci-fi-btn ${drawMode ? 'active' : ''}`}
                                    onClick={() => dispatch(setDrawMode(!drawMode))}
                                >
                                    {drawMode ? T.stopDraw : T.startDraw}
                                </button>
                                <button className="sci-fi-btn" onClick={handleSaveLeyLine} style={{ marginTop: 5 }}>
                                    {T.saveLine}
                                </button>
                            </div>


                            <div className="sci-fi-section mobile-only-section">
                                <div className="section-title">{T.mapTypes}</div>
                                <div className="map-types-grid">
                                    {[
                                        { id: 'street', name: 'Calle' },
                                        { id: 'satellite', name: 'Satélite' },
                                        { id: 'topo', name: 'Topo' },
                                        { id: 'dark', name: 'Dark' },
                                        { id: 'google-hybrid', name: 'Hybrid' },
                                    ].map(l => (
                                        <button
                                            key={l.id}
                                            className={`sci-fi-btn small ${selectedLayer === l.id ? 'active' : ''}`}
                                            onClick={() => dispatch(setSelectedLayer(l.id))}
                                        >
                                            {l.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {editingMarkerId !== null ? (
                                <div className="sci-fi-section">
                                    <div className="section-title">{T.editMarker}</div>
                                    <label className="sci-fi-label">{T.name}</label>
                                    <input className="sci-fi-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                                    <label className="sci-fi-label">{T.desc}</label>
                                    <textarea className="sci-fi-textarea" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                                    <label className="sci-fi-label">{T.image}</label>
                                    <div className="image-upload-area">
                                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="marker-img-upload" />
                                        <label htmlFor="marker-img-upload" style={{ cursor: 'pointer', display: 'block' }}>{editForm.image ? 'Cambiar Imagen' : 'Subir Imagen'}</label>
                                        {editForm.image && <img src={editForm.image} alt="Preview" className="image-preview" />}
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button className="sci-fi-btn" onClick={handleSaveMarkerEdit}>💾 {T.save}</button>
                                        <button className="sci-fi-btn danger" onClick={handleCancelEdit}>❌ {T.cancel}</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="sci-fi-section">
                                    <div className="section-title">{T.activePoints} ({activeMarkers.length})</div>
                                    <ul className="sci-fi-list">
                                        {activeMarkers.map((m) => (
                                            <li key={m.id} className="sci-fi-list-item">
                                                <span>{m.name}</span>
                                                <div className="item-actions">
                                                    <button onClick={() => startEditingMarker(m.id)}>✏️</button>
                                                    <button onClick={() => dispatch(removeActiveMarker(m.id))}>🗑️</button>
                                                </div>
                                            </li>
                                        ))}
                                        {activeMarkers.length === 0 && <li className="muted" style={{ padding: 10, fontSize: '0.8rem' }}>---</li>}
                                    </ul>
                                </div>
                            )}

                            <div className="sci-fi-section">
                                <div className="section-title">{T.savedLines} ({leyLines.length})</div>
                                <ul className="sci-fi-list">
                                    {leyLines.map((l) => (
                                        <li key={l.id} className="sci-fi-list-item">
                                            <span style={{ color: l.color }}>{l.name}</span>
                                            <div className="item-actions">
                                                <button onClick={() => dispatch(deleteLeyLine(l.id))}>🗑️</button>
                                            </div>
                                        </li>
                                    ))}
                                    {leyLines.length === 0 && <li className="muted" style={{ padding: 10, fontSize: '0.8rem' }}>---</li>}
                                </ul>
                            </div>
                        </>
                    )}

                    {/* ANALYSIS TAB */}
                    {activeTab === 'analysis' && (
                        <>
                            <div className="sci-fi-section">
                                <div className="section-title">{T.analysisControls}</div>
                                <button onClick={() => dispatch(setAnalysisMode(analysisMode === 'box' ? 'none' : 'box'))} className={`sci-fi-btn ${analysisMode === 'box' ? 'active' : ''}`}>
                                    {analysisMode === 'box' ? T.cancelArea : T.defineArea}
                                </button>
                                <button onClick={() => dispatch(setShowHeatmap(!showHeatmap))} className={`sci-fi-btn ${showHeatmap ? 'active' : ''}`}>
                                    {showHeatmap ? T.hideHeatmap : T.showHeatmap}
                                </button>
                            </div>
                            <div className="sci-fi-section">
                                <div className="section-title">{T.process}</div>
                                <button className="sci-fi-btn" disabled={!analysisBounds || loading} onClick={handleDetectPatterns}>{loading ? '...' : T.detectPatterns}</button>
                                <button className="sci-fi-btn" disabled={!analysisBounds || loading} onClick={handleSearchEntities}>{loading ? '...' : T.searchEntities}</button>
                                <button className="sci-fi-btn" disabled={!analysisResult && entities.length === 0} onClick={handleGenerateReport} style={{ borderColor: '#00ff00', color: '#00ff00' }}>{T.genReport}</button>
                            </div>
                            {/* ... Results (keep existing logic simpler) ... */}
                            <AnalysisCharts patterns={analysisResult?.patterns || []} entities={entities} bounds={analysisBounds} />
                        </>
                    )}

                    {/* SEARCH TAB */}
                    {activeTab === 'search' && (
                        <div className="sci-fi-section">
                            <div className="section-title">{T.search}</div>
                            <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                                <input className="sci-fi-input" placeholder={T.searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                                <button className="sci-fi-btn" onClick={handleSearch} disabled={searchLoading}>{searchLoading ? '...' : '🔍'}</button>
                            </div>
                            <ul className="sci-fi-list">
                                {searchResults.map((result, index) => (
                                    <li key={index} className="sci-fi-list-item" onClick={() => handleSelectLocation(result.lat, result.lon)} style={{ cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 'bold' }}>{result.display_name.split(',')[0]}</span>
                                            <span style={{ fontSize: '0.8em', opacity: 0.7 }}>{result.display_name}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* SYSTEM TAB */}
                    {activeTab === 'system' && (
                        <>
                            <div className="sci-fi-section">
                                <div className="section-title">{T.dataTools}</div>
                                <div className="sci-fi-btn" style={{ position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
                                    {T.loadFile}
                                    <input
                                        type="file"
                                        accept=".geojson,.json,.kml,.kmz"
                                        onChange={(e) => handleLoadFile(e.target.files?.[0] || null)}
                                        className="file-import-input"
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
                                    <button className="sci-fi-btn" style={{ flex: 1 }} onClick={handleExport}>{T.exportFile}</button>
                                    <button className="sci-fi-btn danger" style={{ flex: 1 }} onClick={handleClear}>{T.clearMap}</button>
                                </div>
                                <div style={{ marginTop: 5 }}>
                                    <button className="sci-fi-btn" onClick={handleExport} style={{ border: '2px dashed yellow', color: 'yellow' }}>⚠️ TEST EXPORT BUTTON ⚠️</button>
                                </div>
                            </div>
                            <div className="sci-fi-section">
                                <div className="section-title">{T.language}</div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button className={`sci-fi-btn ${language === 'es' ? 'active' : ''}`} onClick={() => dispatch(setLanguage('es'))}>Español 🇪🇸</button>
                                    <button className={`sci-fi-btn ${language === 'en' ? 'active' : ''}`} onClick={() => dispatch(setLanguage('en'))}>English 🇺🇸</button>
                                </div>
                            </div>

                            <div className="sci-fi-section">
                                <div className="section-title">{T.config}</div>
                                <div style={{ marginBottom: 15 }}>
                                    <label className="sci-fi-checkbox-label" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={enableSimulation} onChange={(e) => dispatch(setSimulationMode(e.target.checked))} style={{ marginRight: 10 }} />
                                        <span>{T.simulation}</span>
                                    </label>
                                </div>

                                <div className="api-keys-section">
                                    <label className="sci-fi-label">NewsAPI Key</label>
                                    <input type="password" title="NewsAPI Key" className="sci-fi-input small" value={useAppSelector(s => s.config.newsApiKey)} onChange={(e) => dispatch(setNewsApiKey(e.target.value))} />

                                    <label className="sci-fi-label">GNews Key</label>
                                    <input type="password" title="GNews Key" className="sci-fi-input small" value={useAppSelector(s => s.config.gnewsApiKey)} onChange={(e) => dispatch(setGNewsApiKey(e.target.value))} />

                                    <label className="sci-fi-label">Mediastack Key</label>
                                    <input type="password" title="Mediastack Key" className="sci-fi-input small" value={useAppSelector(s => s.config.mediastackApiKey)} onChange={(e) => dispatch(setMediastackApiKey(e.target.value))} />

                                    <label className="sci-fi-label">Google Search Key</label>
                                    <input type="password" title="Google Search Key" className="sci-fi-input small" value={useAppSelector(s => s.config.googleSearchApiKey)} onChange={(e) => dispatch(setGoogleSearchApiKey(e.target.value))} />

                                    <label className="sci-fi-label">Search Engine ID</label>
                                    <input type="password" title="Search Engine ID" className="sci-fi-input small" value={useAppSelector(s => s.config.googleSearchEngineId)} onChange={(e) => dispatch(setGoogleSearchEngineId(e.target.value))} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
