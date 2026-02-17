import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import PlanetaryVibration from '../features/planetary/PlanetaryVibration';
import MissionControl from '../features/dashboard/MissionControl';
import GlobalAnalyticsDashboard from '../features/analytics/GlobalAnalyticsDashboard'; // Import
import '../theme/CyberTheme.css';

// Reuse existing actions/logic
import {
    setDrawMode,
    addLeyLine,
    setAnalysisMode,
    setSelectedLayer,
    toggleOverlay,
    setMapView,
    resetMap,
    updateActiveMarker,
    setAnalysisResult,
    setShowHeatmap,
    type LeyLine,
} from '../features/map/mapSlice';
import {
    setLanguage
} from '../features/config/configSlice';
import { detectPatterns } from '../features/analysis/PatternDetector';
import { searchEntities } from '../features/analysis/EntityDatabase';
import { generateReport } from '../features/analysis/ReportGenerator';
import CyberTopBar from './components/CyberTopBar';
import MapContainer from '../features/map/MapContainer';
import { useMapPersistence } from "../features/map/useMapPersistence";
import { TEXTS } from '../i18n/texts';
import { kml } from "@mapbox/togeojson";
import tokml from "tokml";
import JSZip from "jszip";

export default function CyberLayout() {
    useMapPersistence();
    // === LAYOUT STATE ===
    const [leftPanelOpen, setLeftPanelOpen] = useState(true); // System/Map Tools
    const [rightPanelOpen, setRightPanelOpen] = useState(false); // Mission Control
    const [planetaryOpen, setPlanetaryOpen] = useState(false); // Planetary Vibration
    const [analyticsOpen, setAnalyticsOpen] = useState(false); // Global Analytics
    const [mobileView, setMobileView] = useState(window.innerWidth < 768);
    const [activeMobileTab, setActiveMobileTab] = useState<'map' | 'tools' | 'mission'>('map');

    useEffect(() => {
        const handleResize = () => setMobileView(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // === APPLICATION LOGIC (Lifted from UnifiedMenu) ===
    const dispatch = useAppDispatch();
    const { activeMarkers, leyLines, drawMode, analysisMode, analysisBounds, selectedLayer, activeOverlays, analysisResult, showHeatmap } = useAppSelector((state) => state.map);
    // @ts-ignore
    const { enableSimulation, gnewsApiKey, newsApiKey, apiTubeApiKey, googleSearchApiKey, googleSearchEngineId, language } = useAppSelector((state) => state.config);

    const T = TEXTS[language as 'es' | 'en'] || TEXTS.es;

    const [loading, setLoading] = useState(false);

    // -- Advanced Filters --
    const [analysisKeyword, setAnalysisKeyword] = useState("");
    const [analysisDateFrom, setAnalysisDateFrom] = useState("");
    const [analysisDateTo, setAnalysisDateTo] = useState("");

    // -- File Import Logic --
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
            if (newLines.length) {
                newLines.forEach(l => dispatch(addLeyLine(l)));
            }

            if (extraMarkers.length) {
                extraMarkers.forEach(m => dispatch(updateActiveMarker(m)));
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

    // -- Handlers --

    // -- Handlers --
    // Form population removed as state was unused

    const handleSaveLeyLine = () => {
        if (activeMarkers.length < 2) { alert("Añade al menos 2 puntos."); return; }
        dispatch(addLeyLine({ id: Date.now(), name: `Línea ${leyLines.length + 1}`, color: "#00f0ff", markers: [...activeMarkers] }));
        dispatch({ type: 'map/clearActiveMarkers' });
    };

    const handleDetectPatterns = async () => {
        if (!analysisBounds) return;
        setLoading(true);
        try {
            const config = {
                enableSimulation, gnewsApiKey, newsApiKey, apiTubeApiKey, googleSearchApiKey, googleSearchEngineId,
                keyword: analysisKeyword,
                dateFrom: analysisDateFrom,
                dateTo: analysisDateTo
            };
            const result = await detectPatterns(leyLines, analysisBounds, config, activeMarkers);
            dispatch(setAnalysisResult(result));
            // Auto-open dashboard/mission control on success
            if (mobileView) setActiveMobileTab('mission');
            else setRightPanelOpen(true);
        } catch (error) { console.error(error); alert("Error en análisis."); }
        finally { setLoading(false); }
    };

    const handleSearchEntities = () => {
        if (!analysisBounds) return;
        setLoading(true);
        setTimeout(async () => {
            const results = await searchEntities(analysisBounds);
            if (analysisResult) {
                const combined = [...(analysisResult.entities || []), ...results];
                const unique = combined.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
                dispatch(setAnalysisResult({ ...analysisResult, entities: unique }));
            }
            setLoading(false);
            if (mobileView) setActiveMobileTab('mission');
            else setRightPanelOpen(true);
        }, 1000);
    };

    const handleGenerateReport = () => {
        if (analysisResult) generateReport(analysisResult.patterns, analysisResult.entities || [], analysisResult.news, analysisBounds);
    }

    const handleMapAction = () => {
        if (activeMobileTab === 'map') {
            // Already on map, try to center on user
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        dispatch(setMapView({
                            center: [position.coords.latitude, position.coords.longitude],
                            zoom: 15
                        }));
                    },
                    (error) => {
                        console.error("Error getting location", error);
                        // Optional fallback: Reset to default view if needed, or notify user
                        alert("No se pudo obtener la ubicación. Verifica los permisos.");
                    }
                );
            } else {
                alert("Geolocalización no soportada por este navegador.");
            }
        } else {
            setActiveMobileTab('map');
        }
    };

    // Layout Helpers
    const toggleLeft = () => setLeftPanelOpen(!leftPanelOpen);
    const toggleRight = () => setRightPanelOpen(!rightPanelOpen);

    // Top Bar Height Offset
    const TOP_OFFSET = 70;

    return (
        <div className="cyber-layout" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>

            {/* === MAP LAYER (Background, z-index 0) === */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
                <MapContainer />
            </div>



            {/* === GLOBAL TOP BAR (Replaces old header) === */}
            <CyberTopBar
                onToggleDashboard={toggleRight}
                dashboardOpen={rightPanelOpen}
                mobileView={mobileView}
                onTogglePlanetary={() => setPlanetaryOpen(!planetaryOpen)}
                planetaryOpen={planetaryOpen}
                onToggleAnalytics={() => setAnalyticsOpen(!analyticsOpen)}
            />

            {/* === PLANETARY VIBRATION OVERLAY === */}
            {planetaryOpen && (
                <PlanetaryVibration onClose={() => setPlanetaryOpen(false)} />
            )}

            {/* === DESKTOP LEFT SIDEBAR === */}
            {(!mobileView && leftPanelOpen) && (
                <div className="cyber-panel" style={{
                    position: 'absolute', top: TOP_OFFSET, left: 20, bottom: 20, width: 300, zIndex: 1000,
                    display: 'flex', flexDirection: 'column', pointerEvents: 'auto'
                }}>
                    <div className="cyber-panel-header">
                        <span className="cyber-title">SYSTEM TOOLS</span>
                        <button className="cyber-button-icon" onClick={toggleLeft}>×</button>
                    </div>

                    <div style={{ padding: 15, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Map Mode */}
                        <div>
                            <div className="data-label">{T.tools}</div>
                            <div className="hud-line"></div>
                            <button className={`cyber-button ${drawMode ? 'active' : ''}`} style={{ width: '100%', marginBottom: 10 }} onClick={() => dispatch(setDrawMode(!drawMode))}>
                                {drawMode ? T.stopDraw : T.startDraw}
                            </button>
                            <button className="cyber-button" style={{ width: '100%' }} onClick={handleSaveLeyLine}>
                                {T.saveLine}
                            </button>
                        </div>

                        {/* Data Tools (New) */}
                        <div>
                            <div className="data-label">{T.dataTools}</div>
                            <div className="hud-line"></div>
                            <div className="cyber-button" style={{ position: 'relative', overflow: 'hidden', textAlign: 'center', marginBottom: 5 }}>
                                {T.loadFile}
                                <input
                                    type="file"
                                    accept=".geojson,.json,.kml,.kmz"
                                    onChange={(e) => handleLoadFile(e.target.files?.[0] || null)}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 5 }}>
                                <button className="cyber-button" style={{ flex: 1 }} onClick={handleExport}>{T.exportFile}</button>
                                <button className="cyber-button" style={{ flex: 1, borderColor: '#ff4444', color: '#ff4444' }} onClick={handleClear}>{T.clearMap}</button>
                            </div>
                        </div>

                        {/* Language (New) */}
                        <div>
                            <div className="data-label">{T.language}</div>
                            <div className="hud-line"></div>
                            <div style={{ display: 'flex', gap: 5 }}>
                                <button className={`cyber-button ${language === 'es' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => dispatch(setLanguage('es'))}>ESP</button>
                                <button className={`cyber-button ${language === 'en' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => dispatch(setLanguage('en'))}>ENG</button>
                            </div>
                        </div>

                        {/* Analysis Controls */}
                        <div>
                            <div className="data-label">{T.analysisControls}</div>
                            <div className="hud-line"></div>

                            {/* Advanced Filters UI */}
                            <div style={{ marginBottom: 15, display: 'flex', flexDirection: 'column', gap: 5 }}>
                                <input
                                    type="text"
                                    className="cyber-input"
                                    placeholder="Palabra Clave (Opcional)"
                                    value={analysisKeyword}
                                    onChange={(e) => setAnalysisKeyword(e.target.value)}
                                    style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #333', padding: '5px', fontSize: '0.8rem' }}
                                />
                                <div style={{ display: 'flex', gap: 5 }}>
                                    <input
                                        type="date"
                                        className="cyber-input"
                                        value={analysisDateFrom}
                                        onChange={(e) => setAnalysisDateFrom(e.target.value)}
                                        style={{ flex: 1, background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #333', padding: '5px', fontSize: '0.7rem' }}
                                    />
                                    <input
                                        type="date"
                                        className="cyber-input"
                                        value={analysisDateTo}
                                        onChange={(e) => setAnalysisDateTo(e.target.value)}
                                        style={{ flex: 1, background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #333', padding: '5px', fontSize: '0.7rem' }}
                                    />
                                </div>
                                <button
                                    className="cyber-button"
                                    style={{ width: '100%', borderColor: 'var(--cyber-primary)', color: 'var(--cyber-primary)' }}
                                    onClick={handleDetectPatterns}
                                    disabled={!analysisBounds || loading}
                                >
                                    {loading ? '...' : '🔍 ' + T.detectPatterns}
                                </button>
                            </div>

                            <button
                                className={`cyber-button ${analysisMode === 'box' ? 'active' : ''}`}
                                style={{ width: '100%', marginBottom: 10 }}
                                onClick={() => dispatch(setAnalysisMode(analysisMode === 'box' ? 'none' : 'box'))}
                            >
                                {analysisMode === 'box' ? T.cancelArea : T.defineArea}
                            </button>
                            <button className="cyber-button" style={{ width: '100%', marginBottom: 10 }} onClick={handleSearchEntities} disabled={!analysisBounds || loading}>
                                {T.searchEntities}
                            </button>

                            {/* Heatmap Toggle (High visibility) */}
                            <button
                                className={`cyber-button ${showHeatmap ? 'active' : ''}`}
                                style={{ width: '100%', borderColor: '#ff6b6b', color: showHeatmap ? 'white' : '#ff6b6b' }}
                                onClick={() => dispatch(setShowHeatmap(!showHeatmap))}
                            >
                                {showHeatmap ? '🔥 ' + T.heatMap + ' (ON)' : '🔥 ' + T.heatMap + ' (OFF)'}
                            </button>
                        </div>

                        {/* Layers */}
                        <div>
                            <div className="data-label">{T.layers}</div>
                            <div className="hud-line"></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                                {['street', 'satellite', 'dark', 'topo'].map(l => (
                                    <button
                                        key={l}
                                        className={`cyber-button ${selectedLayer === l ? 'active' : ''}`}
                                        style={{ fontSize: '0.7rem', padding: '5px' }}
                                        onClick={() => dispatch(setSelectedLayer(l))}
                                    >
                                        {l.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Overlays */}
                        <div>
                            <div className="data-label">{T.overlays}</div>
                            <div className="hud-line"></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                                {['hydro', 'railway', 'geology'].map(l => (
                                    <button
                                        key={l}
                                        className={`cyber-button ${activeOverlays.includes(l) ? 'active' : ''}`}
                                        style={{ fontSize: '0.7rem', padding: '5px' }}
                                        onClick={() => dispatch(toggleOverlay(l))}
                                    >
                                        {l.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === DESKTOP RIGHT SIDEBAR (MISSION CONTROL) === */}
            {(!mobileView && rightPanelOpen) && (
                <div className="cyber-panel" style={{
                    position: 'absolute', top: TOP_OFFSET, right: 20, bottom: 20, width: 350, zIndex: 1000,
                    display: 'flex', flexDirection: 'column', pointerEvents: 'auto'
                }}>
                    <div className="cyber-panel-header">
                        <span className="cyber-title">MISSION LOG</span>
                        <button className="cyber-button-icon" onClick={toggleRight}>×</button>
                    </div>
                    <div style={{ height: '100%', overflowY: 'auto' }}>
                        <MissionControl
                            analysisResult={analysisResult}
                            entities={analysisResult?.entities || []}
                            analysisBounds={analysisBounds}
                            news={analysisResult?.news || []}
                            leyLines={leyLines}
                            activeMarkers={activeMarkers}
                            onOpenAnalytics={() => setAnalyticsOpen(true)}
                        />
                    </div>
                    <div style={{ padding: 10, borderTop: '1px solid var(--cyber-border-color)' }}>
                        <button className="cyber-button" style={{ width: '100%' }} onClick={handleGenerateReport} disabled={!analysisResult}>
                            DOWNLOAD REPORT
                        </button>
                    </div>
                </div>
            )}

            {/* === DESKTOP TOGGLES (When closed) === */}
            {!mobileView && !leftPanelOpen && (
                <button
                    className="cyber-button"
                    style={{ position: 'absolute', top: TOP_OFFSET, left: 20, zIndex: 900, pointerEvents: 'auto' }}
                    onClick={toggleLeft}
                >
                    TOOLS
                </button>
            )}

            {/* Dashboard button moved to Top Bar, but maybe keep a floating one if Top Bar toggle is subtle? 
                No, Top Bar toggle is explicit "DASHBOARD". Removing floating dashboard button.
            */}

            {/* === MOBILE INTERFACE === */}
            {mobileView && (
                <>
                    {/* Top Bar Status replaced by CyberTopBar, but need to consider mobile layout for it.
                        CyberTopBar is persistent. We might need to hide it if Mobile Drawer covers it? 
                        No, Drawers usually go below. 
                        We can keep it.
                    */}

                    {/* Bottom Nav */}
                    <div className="cyber-panel" style={{
                        position: 'absolute', bottom: 40, left: 20, right: 20, height: 60, zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
                        borderRadius: 30, pointerEvents: 'auto'
                    }}>
                        <button className={`cyber-button-icon ${activeMobileTab === 'tools' ? 'active' : ''}`} onClick={() => setActiveMobileTab(activeMobileTab === 'tools' ? 'map' : 'tools')}>
                            🛠️
                        </button>
                        <button className={`cyber-button-icon ${activeMobileTab === 'map' ? 'active' : ''}`} onClick={handleMapAction} style={{ transform: 'scale(1.2)', border: '1px solid var(--cyber-primary)', borderRadius: '50%' }}>
                            🗺️
                        </button>
                        <button className={`cyber-button-icon ${activeMobileTab === 'mission' ? 'active' : ''}`} onClick={() => setActiveMobileTab(activeMobileTab === 'mission' ? 'map' : 'mission')}>
                            📊
                        </button>
                    </div>

                    {/* Mobile Drawer: TOOLS */}
                    {activeMobileTab === 'tools' && (
                        <div className="cyber-panel" style={{
                            position: 'absolute', bottom: 110, left: 10, right: 10, maxHeight: '60vh', zIndex: 1000,
                            display: 'flex', flexDirection: 'column', pointerEvents: 'auto'
                        }}>
                            <div className="cyber-panel-header">
                                <span className="cyber-title">FIELD TOOLS</span>
                                <button onClick={() => setActiveMobileTab('map')} style={{ background: 'none', border: 'none', color: 'white' }}>▼</button>
                            </div>
                            <div style={{ padding: 15, overflowY: 'auto' }}>
                                {/* Tools */}
                                <button className="cyber-button" style={{ width: '100%', marginBottom: 10 }} onClick={() => dispatch(setDrawMode(!drawMode))}>
                                    {drawMode ? T.stopDraw : T.startDraw}
                                </button>
                                <button className="cyber-button" style={{ width: '100%' }} onClick={handleSaveLeyLine}>
                                    {T.saveLine}
                                </button>

                                <div className="hud-line"></div>

                                {/* Data Tools (Mobile) */}
                                <div className="data-label">{T.dataTools}</div>
                                <div className="cyber-button" style={{ position: 'relative', overflow: 'hidden', textAlign: 'center', marginBottom: 5 }}>
                                    {T.loadFile}
                                    <input
                                        type="file"
                                        accept=".geojson,.json,.kml,.kmz"
                                        onChange={(e) => handleLoadFile(e.target.files?.[0] || null)}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                                    <button className="cyber-button" style={{ flex: 1 }} onClick={handleExport}>{T.exportFile}</button>
                                    <button className="cyber-button" style={{ flex: 1, borderColor: '#ff4444', color: '#ff4444' }} onClick={handleClear}>{T.clearMap}</button>
                                </div>

                                <div className="hud-line"></div>

                                {/* Language (Mobile) */}
                                <div className="data-label">{T.language}</div>
                                <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                                    <button className={`cyber-button ${language === 'es' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => dispatch(setLanguage('es'))}>ESP</button>
                                    <button className={`cyber-button ${language === 'en' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => dispatch(setLanguage('en'))}>ENG</button>
                                </div>

                                <div className="hud-line"></div>

                                <div className="data-label">{T.layers}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 10 }}>
                                    {['street', 'satellite', 'dark', 'topo'].map(l => (
                                        <button
                                            key={l}
                                            className={`cyber-button ${selectedLayer === l ? 'active' : ''}`}
                                            style={{ fontSize: '0.7rem', padding: '5px' }}
                                            onClick={() => dispatch(setSelectedLayer(l))}
                                        >
                                            {l.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                                <div className="data-label">{T.overlays}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 10 }}>
                                    {['hydro', 'railway', 'geology'].map(l => (
                                        <button
                                            key={l}
                                            className={`cyber-button ${activeOverlays.includes(l) ? 'active' : ''}`}
                                            style={{ fontSize: '0.7rem', padding: '5px' }}
                                            onClick={() => dispatch(toggleOverlay(l))}
                                        >
                                            {l.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                                <div className="hud-line"></div>
                                <div className="data-label">{T.analysisControls}</div>

                                {/* Mobile Keywords */}
                                <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    <input
                                        type="text"
                                        className="cyber-input"
                                        placeholder="Palabra Clave (Opcional)"
                                        value={analysisKeyword}
                                        onChange={(e) => setAnalysisKeyword(e.target.value)}
                                        style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #333', padding: '10px', fontSize: '1rem' }}
                                    />
                                    <button
                                        className="cyber-button"
                                        style={{ width: '100%', borderColor: 'var(--cyber-primary)', color: 'var(--cyber-primary)' }}
                                        onClick={handleDetectPatterns}
                                        disabled={!analysisBounds || loading}
                                    >
                                        {loading ? '...' : '🔍 ' + T.detectPatterns}
                                    </button>
                                </div>

                                <button
                                    className={`cyber-button ${analysisMode === 'box' ? 'active' : ''}`}
                                    style={{ width: '100%', marginBottom: 10 }}
                                    onClick={() => dispatch(setAnalysisMode(analysisMode === 'box' ? 'none' : 'box'))}
                                >
                                    {analysisMode === 'box' ? T.cancelArea : T.defineArea}
                                </button>

                                <button className="cyber-button" style={{ width: '100%', marginBottom: 10 }} onClick={handleSearchEntities} disabled={!analysisBounds || loading}>
                                    {T.searchEntities}
                                </button>

                                {/* Mobile Heatmap Toggle */}
                                <button
                                    className={`cyber-button ${showHeatmap ? 'active' : ''}`}
                                    style={{ width: '100%', borderColor: '#ff6b6b', color: showHeatmap ? 'white' : '#ff6b6b' }}
                                    onClick={() => dispatch(setShowHeatmap(!showHeatmap))}
                                >
                                    {showHeatmap ? '🔥 ' + T.heatMap + ' (ON)' : '🔥 ' + T.heatMap + ' (OFF)'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Mobile Drawer: MISSION CONTROL */}
                    {activeMobileTab === 'mission' && (
                        <div className="cyber-panel" style={{
                            position: 'absolute', bottom: 110, left: 10, right: 10, maxHeight: '80vh', height: '70%', zIndex: 1000,
                            display: 'flex', flexDirection: 'column', pointerEvents: 'auto'
                        }}>
                            <div className="cyber-panel-header">
                                <span className="cyber-title">DASHBOARD</span>
                                <button onClick={() => setActiveMobileTab('map')} style={{ background: 'none', border: 'none', color: 'white' }}>▼</button>
                            </div>
                            <div style={{ padding: 0, overflowY: 'auto', flex: 1 }}>
                                <MissionControl
                                    analysisResult={analysisResult}
                                    entities={analysisResult?.entities || []}
                                    analysisBounds={analysisBounds}
                                    news={analysisResult?.news || []}
                                    leyLines={leyLines}
                                    activeMarkers={activeMarkers}
                                    onOpenAnalytics={() => setAnalyticsOpen(true)}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* GLOBAL ANALYTICS DASHBOARD OVERLAY */}
            {analyticsOpen && <GlobalAnalyticsDashboard onClose={() => setAnalyticsOpen(false)} />}
        </div>
    );
}
