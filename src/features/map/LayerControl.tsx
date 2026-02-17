import { useState, useRef } from 'react';
import { useMap, useMapEvent } from 'react-leaflet';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedLayer, toggleOverlay, resetMap, addLeyLine, addActiveMarker, type LeyLine, type MarkerData } from './mapSlice';
import * as toGeoJSON from '@mapbox/togeojson';
import JSZip from 'jszip';
import './LayerControl.css';
import { TEXTS } from '../../i18n/texts';

const baseLayers = [
    { id: 'street', name: 'Calle', name_en: 'Street', icon: '🗺️' },
    { id: 'satellite', name: 'Satélite', name_en: 'Satellite', icon: '🛰️' },
    { id: 'google-hybrid', name: 'Híbrido', name_en: 'Hybrid', icon: '🌍' },
    { id: 'topo', name: 'Topográfico', name_en: 'Topo', icon: '⛰️' },
    { id: 'terrain', name: 'Terreno', name_en: 'Terrain', icon: '🏔️' },
    { id: 'light', name: 'Claro', name_en: 'Light', icon: '☀️' },
    { id: 'dark', name: 'Oscuro', name_en: 'Dark', icon: '🌑' },
];

const overlayLayers = [
    { id: 'geology', name: 'Geología', name_en: 'Geology', icon: '🪨' },
    { id: 'railway', name: 'Ferrocarriles', name_en: 'Railways', icon: '🚂' },
    { id: 'hydro', name: 'Hidrografía', name_en: 'Hydro', icon: '💧' },
];

export default function LayerControl() {
    const dispatch = useAppDispatch();
    const map = useMap(); // Access map instance
    const selectedLayer = useAppSelector((state) => state.map.selectedLayer);
    const activeOverlays = useAppSelector((state) => state.map.activeOverlays);
    // @ts-ignore
    const { language } = useAppSelector((state) => state.config);
    const T = TEXTS[language as 'es' | 'en'] || TEXTS.es;

    const [isOpen, setIsOpen] = useState(false);
    const [streetViewActive, setStreetViewActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);

    // Street View Handler
    useMapEvent('click', (e) => {
        if (streetViewActive) {
            const { lat, lng } = e.latlng;
            window.open(`https://www.google.com/maps?layer=c&cbll=${lat},${lng}`, '_blank');
            setStreetViewActive(false);
            document.body.style.cursor = 'default';
        }
    });

    const toggleStreetView = () => {
        const newState = !streetViewActive;
        setStreetViewActive(newState);
        document.body.style.cursor = newState ? 'crosshair' : 'default';
        setIsOpen(false); // Close menu after selection
    };

    const openWebcams = () => {
        const center = map.getCenter();
        window.open(`https://www.windy.com/-Webcams/?webcams,${center.lat},${center.lng},12`, '_blank');
        setIsOpen(false);
    };

    const handleClearMap = () => {
        if (window.confirm(T.confirmClear)) {
            dispatch(resetMap());
            setIsOpen(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            let geoJSON: any = null;

            if (file.name.endsWith('.kmz')) {
                const zip = await JSZip.loadAsync(file);
                const kmlFile = Object.keys(zip.files).find(n => n.endsWith('.kml'));
                if (kmlFile) {
                    const kmlText = await zip.files[kmlFile].async('string');
                    const parser = new DOMParser();
                    const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
                    geoJSON = toGeoJSON.kml(kmlDoc);
                }
            } else if (file.name.endsWith('.kml')) {
                const text = await file.text();
                const parser = new DOMParser();
                const kmlDoc = parser.parseFromString(text, 'text/xml');
                geoJSON = toGeoJSON.kml(kmlDoc);
            } else if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
                const text = await file.text();
                geoJSON = JSON.parse(text);
            }

            if (geoJSON && geoJSON.features) {
                let linesAdded = 0;
                let markersAdded = 0;
                const importTimestamp = Date.now();

                geoJSON.features.forEach((feature: any, featureIdx: number) => {
                    if (feature.geometry.type === 'LineString') {
                        const coords = feature.geometry.coordinates.map((c: any) => ({ lat: c[1], lng: c[0] }));
                        const lineId = importTimestamp + (featureIdx * 1000) + Math.floor(Math.random() * 1000);

                        const newLine: LeyLine = {
                            id: lineId,
                            name: feature.properties?.name || 'Linea Importada',
                            color: feature.properties?.stroke || '#ff0000',
                            markers: coords.map((c: any, ptIdx: number) => ({
                                id: lineId + ptIdx + 1, // Significant offset to ensure no overlap with other lines
                                lat: c.lat,
                                lng: c.lng,
                                name: `Pt ${ptIdx}`,
                            }))
                        };
                        dispatch(addLeyLine(newLine));
                        linesAdded++;
                    } else if (feature.geometry.type === 'Point') {
                        const newMarker: MarkerData = {
                            id: importTimestamp + (featureIdx * 1000) + Math.floor(Math.random() * 1000),
                            lat: feature.geometry.coordinates[1],
                            lng: feature.geometry.coordinates[0],
                            name: feature.properties?.name || 'Punto Importado',
                            description: feature.properties?.description || ''
                        };
                        dispatch(addActiveMarker(newMarker));
                        markersAdded++;
                    }
                });
                alert(T.importSuccess);
            } else {
                alert(T.importError);
            }

        } catch (error) {
            console.error("Error leyendo archivo:", error);
            alert(T.importError);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setIsOpen(false);
        }
    };

    return (
        <div className={`layer-control map-types-control ${isOpen ? 'open' : 'closed'}`}>
            <button
                className="toggle-btn"
                onClick={() => setIsOpen(!isOpen)}
                title={T.layers}
            >
                {isOpen ? '❌' : '🗺️'}
            </button>

            <div className="layers-list">
                <div className="layers-section-title">{T.base}</div>
                {baseLayers.map((layer) => (
                    <button
                        key={layer.id}
                        className={`layer-btn ${selectedLayer === layer.id ? 'active' : ''}`}
                        onClick={() => {
                            dispatch(setSelectedLayer(layer.id));
                        }}
                        // @ts-ignore
                        title={language === 'en' ? layer.name_en : layer.name}
                    >
                        {/* @ts-ignore */}
                        <span className="layer-icon">{layer.icon}</span>
                        {/* @ts-ignore */}
                        <span className="layer-name">{language === 'en' ? layer.name_en : layer.name}</span>
                        {selectedLayer === layer.id && <span className="layer-check">✓</span>}
                    </button>
                ))}

                <div className="layers-separator"></div>
                <div className="layers-section-title">{T.overlays}</div>

                {overlayLayers.map((layer) => (
                    <button
                        key={layer.id}
                        className={`layer-btn ${activeOverlays.includes(layer.id) ? 'active' : ''}`}
                        onClick={() => dispatch(toggleOverlay(layer.id))}
                        // @ts-ignore
                        title={language === 'en' ? layer.name_en : layer.name}
                    >
                        {/* @ts-ignore */}
                        <span className="layer-icon">{layer.icon}</span>
                        {/* @ts-ignore */}
                        <span className="layer-name">{language === 'en' ? layer.name_en : layer.name}</span>
                        <span className={`layer-checkbox ${activeOverlays.includes(layer.id) ? 'checked' : ''}`}>
                            {activeOverlays.includes(layer.id) ? '☑️' : '⬜'}
                        </span>
                    </button>
                ))}

                <div className="layers-separator"></div>
                <div className="layers-section-title">{T.tools}</div>

                <div className="tools-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                    <button
                        className="layer-btn"
                        onClick={() => fileInputRef.current?.click()}
                        title={T.loadFile}
                        disabled={loading}
                    >
                        <span className="layer-icon">📂</span>
                        <span className="layer-name">{loading ? '...' : T.loadFile.split(' ')[1]}</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        accept=".kml,.kmz,.geojson,.json"
                    />

                    <button
                        className="layer-btn"
                        onClick={handleClearMap}
                        title={T.clearMap}
                        style={{ borderColor: '#ef5350', color: '#ef5350' }}
                    >
                        <span className="layer-icon">🗑️</span>
                        <span className="layer-name">{T.clearMap.split(' ')[1]}</span>
                    </button>
                </div>

                <button
                    className={`layer-btn ${useAppSelector(state => state.map.showHeatmap) ? 'active' : ''}`}
                    onClick={() => dispatch({ type: 'map/setShowHeatmap', payload: !useAppSelector(state => state.map.showHeatmap) })}
                    title={T.heatMap}
                >
                    <span className="layer-icon">🔥</span>
                    <span className="layer-name">{T.heatMap}</span>
                    {useAppSelector(state => state.map.showHeatmap) && <span className="layer-check">⚡</span>}
                </button>

                <button
                    className={`layer-btn ${streetViewActive ? 'active' : ''}`}
                    onClick={toggleStreetView}
                    title={T.streetView}
                    style={{ background: streetViewActive ? 'rgba(255, 235, 59, 0.3)' : '', borderColor: streetViewActive ? '#ffeb3b' : '' }}
                >
                    <span className="layer-icon">👀</span>
                    <span className="layer-name">{T.streetView}</span>
                    {streetViewActive && <span className="layer-check">⚡</span>}
                </button>

                <button
                    className="layer-btn"
                    onClick={openWebcams}
                    title={T.cams}
                >
                    <span className="layer-icon">📹</span>
                    <span className="layer-name">{T.cams}</span>
                </button>
            </div>
        </div>
    );
}
