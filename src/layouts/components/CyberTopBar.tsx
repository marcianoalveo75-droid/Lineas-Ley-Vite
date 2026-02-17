import { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setMapView, resetMap } from '../../features/map/mapSlice';
import JSZip from "jszip";
import tokml from "tokml";
import '../../theme/CyberTheme.css';
import '../../components/UnifiedMenu.css'; // For sci-fi-input styles

// Reusing icons or creating simple SVG ones
const Icons = {
    Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>,
    Menu: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M3 12h18M3 6h18M3 18h18" /></svg>,
    Dashboard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="M3 9h18M9 21V9" /></svg>,
    Close: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M18 6L6 18M6 6l12 12" /></svg>,
    Report: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
};

import { useNavigate } from 'react-router-dom';

export default function CyberTopBar({
    onToggleDashboard,
    dashboardOpen,
    mobileView,
    onTogglePlanetary,
    planetaryOpen,
    onToggleAnalytics,

}: {
    onToggleDashboard: () => void;
    dashboardOpen: boolean;
    mobileView: boolean;
    onTogglePlanetary: () => void;
    planetaryOpen: boolean;
    onToggleAnalytics: () => void;
}) {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { activeMarkers, leyLines } = useAppSelector((state: any) => state.map);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // System Menu State
    const [systemMenuOpen, setSystemMenuOpen] = useState(false);
    const sysMenuRef = useRef<HTMLDivElement>(null);

    // Close system menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sysMenuRef.current && !sysMenuRef.current.contains(event.target as Node)) {
                setSystemMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- SEARCH LOGIC (From UnifiedMenu) ---
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearchLoading(true);
        setSearchResults([]);
        setShowResults(true);

        // Check coordinates
        const coordMatch = searchQuery.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
        if (coordMatch) {
            const lat = parseFloat(coordMatch[1]);
            const lng = parseFloat(coordMatch[3]);
            dispatch(setMapView({ center: [lat, lng], zoom: 15 }));
            setSearchLoading(false);
            setShowResults(false);
            return;
        }

        // Nominatim Search
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error("Search error:", error);
            alert("Error en la búsqueda (revisa consola).");
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSelectLocation = (lat: string, lng: string, displayName: string) => {
        dispatch(setMapView({ center: [parseFloat(lat), parseFloat(lng)], zoom: 13 }));
        setSearchQuery(displayName.split(',')[0]); // Shorten name
        setShowResults(false);
    };


    // --- SYSTEM ACTIONS (From UnifiedMenu stub) ---
    const handleClearMap = () => {
        if (confirm("Warning: Purge all map data?")) {
            dispatch(resetMap());
            setSystemMenuOpen(false);
        }
    };

    const handleExport = async () => {
        const fc: any = { type: "FeatureCollection", features: [] };
        // ... (Export logic condensed)
        leyLines.forEach((line: any) => {
            fc.features.push({
                type: "Feature",
                properties: { name: line.name, color: line.color, category: "leyline" },
                geometry: { type: "LineString", coordinates: line.markers.map((m: any) => [m.lng, m.lat]) },
            });
        });
        activeMarkers.forEach((m: any) => {
            fc.features.push({
                type: "Feature",
                properties: { name: m.name, description: m.description, image: m.image },
                geometry: { type: "Point", coordinates: [m.lng, m.lat] },
            });
        });

        // @ts-ignore
        const kmlText = tokml(fc, { name: "Ley Lines Data" });
        const zip = new JSZip();
        zip.file("data.kml", kmlText);
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "cyber_export.kmz";
        a.click();
        URL.revokeObjectURL(url);
        setSystemMenuOpen(false);
    };

    return (
        <div className="cyber-panel" style={{
            position: 'absolute', top: 10, left: 10, right: 10, height: 50, zIndex: 2000,
            display: 'flex', alignItems: 'center',
            padding: mobileView ? '0 10px' : '0 15px',
            gap: mobileView ? 10 : 15,
            pointerEvents: 'auto', background: 'rgba(5, 10, 20, 0.95)', border: '1px solid var(--cyber-primary)',
            overflow: 'visible' // Allow dropdown to show outside
        }}>
            {/* Report navigation & Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                    className="cyber-button"
                    onClick={() => navigate('/')}
                    style={{
                        padding: '5px 15px',
                        height: 35,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'rgba(197, 107, 255, 0.2)',
                        border: '1px solid #c56bff',
                        color: '#fff',
                        boxShadow: '0 0 10px rgba(197, 107, 255, 0.3)'
                    }}
                    title="Revisar Reporte Completo"
                >
                    <Icons.Report />
                    <span>{mobileView ? "REPORTE" : "REVISAR REPORTE"}</span>
                </button>
                {!mobileView && (
                    <div className="cyber-title" style={{ fontSize: '1.2rem', whiteSpace: 'nowrap', marginLeft: 10, opacity: 0.8 }}>
                        LEY LINES
                    </div>
                )}
            </div>

            {/* Search Bar - Flex Grow to take available space */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                    className="sci-fi-input"
                    placeholder={mobileView ? "Buscar..." : "Search connection..."}
                    style={{ margin: 0, paddingRight: 35, height: 35, width: '100%', minWidth: 0 }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                />
                <button
                    onClick={handleSearch}
                    style={{
                        position: 'absolute', right: 5, background: 'none', border: 'none',
                        color: 'var(--cyber-primary)', cursor: 'pointer', display: 'flex'
                    }}
                >
                    {searchLoading ? '...' : <Icons.Search />}
                </button>

                {/* Search Results Dropdown */}
                {showResults && (
                    <div className="cyber-panel" style={{
                        position: 'absolute', top: 40, left: 0, right: 0, maxHeight: 300, overflowY: 'auto',
                        zIndex: 2001, boxShadow: '0 10px 20px rgba(0,0,0,0.8)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', background: 'rgba(0,0,0,0.5)' }}>
                            <span className="data-label">RESULTS ({searchResults.length})</span>
                            <button onClick={() => setShowResults(false)} style={{ background: 'none', border: 'none', color: '#666' }}>X</button>
                        </div>

                        {searchResults.length === 0 && !searchLoading ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                                NO TARGETS FOUND
                            </div>
                        ) : (
                            searchResults.map((result, i) => (
                                <div
                                    key={i}
                                    className="sci-fi-list-item"
                                    style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid #111' }}
                                    onClick={() => handleSelectLocation(result.lat, result.lon, result.display_name)}
                                >
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{result.display_name.split(',')[0]}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {result.display_name}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Planetary Toggle */}
            <button
                className={`cyber-button ${planetaryOpen ? 'active' : ''}`}
                onClick={onTogglePlanetary}
                style={{ padding: '5px 15px', height: 35, display: 'flex', alignItems: 'center', gap: 5 }}
            >
                <span style={{ fontSize: '1.2rem' }}>🌍</span>
                {!mobileView && <span>PLANETARY</span>}
            </button>

            {/* Dashboard & Analytics Toggles (Desktop) */}
            {!mobileView && (
                <div style={{ display: 'flex', gap: 5 }}>
                    <button
                        className="cyber-button"
                        onClick={onToggleAnalytics}
                        style={{ padding: '5px 15px', height: 35, display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>📈</span>
                        <span>ANALYTICS</span>
                    </button>
                    <button
                        className={`cyber-button ${dashboardOpen ? 'active' : ''}`}
                        onClick={onToggleDashboard}
                        style={{ padding: '5px 15px', height: 35, display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                        <Icons.Dashboard />
                        <span>DASHBOARD</span>
                    </button>
                </div>
            )}

            {/* System Menu */}
            <div style={{ position: 'relative' }} ref={sysMenuRef}>
                <button
                    className="cyber-button-icon"
                    onClick={() => setSystemMenuOpen(!systemMenuOpen)}
                    style={{ width: 35, height: 35 }}
                >
                    <Icons.Menu />
                </button>

                {systemMenuOpen && (
                    <div className="cyber-panel" style={{
                        position: 'absolute', top: 45, right: 0, width: 220, zIndex: 2001,
                        padding: 10, display: 'flex', flexDirection: 'column', gap: 5
                    }}>
                        <div className="data-label">SYSTEM OPS</div>
                        <button className="cyber-button" onClick={handleExport}>EXPORT DATA (KMZ)</button>
                        <button className="cyber-button danger" onClick={handleClearMap}>PURGE MAP</button>
                        <div className="hud-line"></div>
                        <div className="data-label">CONFIG</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7, padding: 5 }}>
                            API Keys managed via generic config.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
