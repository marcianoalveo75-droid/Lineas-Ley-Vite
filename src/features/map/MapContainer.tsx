import React, { useRef, useCallback, useEffect } from "react";
import {
    MapContainer as LeafletMapContainer,
    TileLayer,
    Marker,
    Polyline,
    Popup,
    LayerGroup,
    Pane,
    useMap,
    useMapEvent,
} from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
    addActiveMarker,
    removeActiveMarker,
    updateLeyLine,
    setEditingMarkerId,
    type MarkerData,
} from "./mapSlice";

/* --- marker icon fix --- */
const markerIcon = new L.Icon({
    iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
    iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
    shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

/* --- MapRefSetter --- */
function MapRefSetter({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
    const map = useMap();
    useEffect(() => {
        mapRef.current = map;
        return () => { mapRef.current = null; };
    }, [map, mapRef]);
    return null;
}

/* --- MapController --- */
function MapController() {
    const map = useMap();
    const { mapView } = useAppSelector((state) => state.map);

    useEffect(() => {
        if (mapView) {
            map.flyTo(mapView.center, mapView.zoom);
        }
    }, [mapView, map]);

    return null;
}

/* --- MapClickAdder --- */
function MapClickAdder({ enabled, onAdd }: { enabled: boolean; onAdd: (lat: number, lng: number) => void }) {
    useMapEvent("click", (e: LeafletMouseEvent) => {
        if (!enabled) return;
        onAdd(e.latlng.lat, e.latlng.lng);
    });
    return null;
}

import LayerControl from "./LayerControl";
import BoundingBoxTool from "./BoundingBoxTool";
import HeatmapLayer from "./HeatmapLayer";
import PatternLayer from "./PatternLayer";
import EntityLayer from "./EntityLayer";

const MapContainer = React.memo(function MapContainer() {
    const mapRef = useRef<L.Map | null>(null);
    const dispatch = useAppDispatch();
    const { activeMarkers, leyLines, drawMode, selectedLayer, activeOverlays, analysisResult } = useAppSelector((state) => state.map);

    /* Add marker when clicking map in draw mode */
    const handleAddMarker = useCallback((lat: number, lng: number) => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        const m: MarkerData = { id, lat, lng, name: `Punto ${activeMarkers.length + 1}` };
        dispatch(addActiveMarker(m));
    }, [activeMarkers.length, dispatch]);

    const getLayerUrl = (layerId: string) => {
        switch (layerId) {
            case 'street': return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'; // Standard Google Streets
            case 'satellite': return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
            case 'topo': return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
            case 'dark': return 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png';
            case 'light': return 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png';
            case 'google-street': return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
            case 'google-sat': return 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
            case 'google-hybrid': return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
            case 'terrain': return 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
            default: return 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'; // Default to Dark
        }
    };

    /* Edit marker fields - REMOVED local function, now using Redux action */

    /* Move point in saved ley line */
    const moveLeyLinePoint = (lineId: number, markerId: number, lat: number, lng: number) => {
        const line = leyLines.find(l => l.id === lineId);
        if (!line) return;
        const newMarkers = line.markers.map(m => m.id === markerId ? { ...m, lat, lng } : m);
        dispatch(updateLeyLine({ ...line, markers: newMarkers }));
    };

    return (
        <LeafletMapContainer
            center={[40.0, -3.7]}
            zoom={6} // Zoom out slightly for better context
            style={{ height: "100%", width: "100%", background: "#050a10" }}
        >
            <MapRefSetter mapRef={mapRef} />
            <MapController />
            <TileLayer key={selectedLayer} url={getLayerUrl(selectedLayer)} attribution="&copy; OpenStreetMap & CartoDB" />

            {activeOverlays.map(overlayId => {
                const getOverlayUrl = (id: string) => {
                    switch (id) {
                        case 'geology': return 'https://tiles.macrostrat.org/carto/{z}/{x}/{y}.png';
                        case 'railway': return 'https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png';
                        case 'hydro': return 'https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png'; // Temporary: using hiking as placeholder if hydro not avail, or use specialized hydro
                        default: return '';
                    }
                };

                // Special handling for hydrography: if waymarked trails doesn't have good hydro, we might need another source.
                // For now using OpenSeaMap for water features if desired, or stay with OpenRailwayMap. 
                // Let's use OpenSeaMap for hydro as it's reliable.
                if (overlayId === 'hydro') {
                    return <TileLayer key={overlayId} url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png" zIndex={10} opacity={0.7} />;
                }

                return (
                    <TileLayer
                        key={overlayId}
                        url={getOverlayUrl(overlayId)}
                        zIndex={10}
                        opacity={0.6}
                    />
                );
            })}

            {/* Re-enabling components now that crash is fixed */}
            <LayerControl />
            <BoundingBoxTool />
            <Pane name="heatmap-pane" style={{ zIndex: 350 }}>
                <HeatmapLayer />
            </Pane>

            {/* Pattern Visualization Layer */}
            {analysisResult && analysisResult.patterns && (
                <Pane name="analysis-patterns" style={{ zIndex: 460 }}>
                    <PatternLayer patterns={analysisResult.patterns} />
                </Pane>
            )}

            {/* Entity Visualization Layer */}
            {analysisResult && analysisResult.entities && (
                <Pane name="analysis-entities" style={{ zIndex: 470 }}>
                    <EntityLayer entities={analysisResult.entities} />
                </Pane>
            )}

            {/* Saved lines - Using Pane to separate layers */}
            <Pane name="saved-lines" style={{ zIndex: 400 }}>
                <LayerGroup>
                    {leyLines.map((line) => (
                        <React.Fragment key={line.id}>
                            {line.markers.length > 1 && <Polyline positions={line.markers.map((m) => [m.lat, m.lng])} color={line.color} weight={4} />}
                            {line.markers.map((m) => {
                                if (!m.lat || !m.lng) return null;
                                return (
                                    <Marker
                                        key={m.id}
                                        position={[m.lat, m.lng]}
                                        icon={markerIcon}
                                        draggable={true}
                                        eventHandlers={{
                                            dragend: (e) => {
                                                const p = (e.target as L.Marker).getLatLng();
                                                moveLeyLinePoint(line.id, m.id, p.lat, p.lng);
                                            },
                                        }}
                                    >
                                        <Popup>
                                            <div style={{ minWidth: 180 }} key={`${m.name}-${m.description}-${m.image}`}>
                                                <b>{m.name}</b>
                                                {m.description && (
                                                    <div style={{ marginTop: 4, fontSize: '0.9em', color: '#666' }}>
                                                        {m.description}
                                                    </div>
                                                )}
                                                {m.image && (
                                                    <div style={{ marginTop: 6 }}>
                                                        <img
                                                            src={m.image}
                                                            alt={m.name}
                                                            style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 4, objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                )}
                                                <div style={{ marginTop: 6 }}>
                                                    <small>{m.lat.toFixed(5)}, {m.lng.toFixed(5)}</small>
                                                </div>
                                                <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                                    <button onClick={(e) => { e.stopPropagation(); dispatch(setEditingMarkerId(m.id)); }}>✏️ Editar</button>
                                                    <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps?layer=c&cbll=${m.lat},${m.lng}`, '_blank'); }}>👀 Street View</button>
                                                    <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.windy.com/-Webcams/`, '_blank'); }}>📹 Cámaras</button>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )
                            })}
                        </React.Fragment>
                    ))}
                </LayerGroup>
            </Pane>

            {/* Active drawing line - Using Pane to separate from saved lines */}
            <Pane name="active-drawing" style={{ zIndex: 450 }}>
                <LayerGroup>
                    {activeMarkers.length > 0 && activeMarkers.every(m => m.lat && m.lng) && (
                        <Polyline positions={activeMarkers.map((m) => [m.lat, m.lng])} color="#ff6b6b" weight={3} dashArray="6" />
                    )}
                    {activeMarkers.map((m) => {
                        if (!m.lat || !m.lng) return null;
                        return (
                            <Marker key={m.id} position={[m.lat, m.lng]} icon={markerIcon}>
                                <Popup>
                                    <div style={{ minWidth: 180 }} key={`${m.name}-${m.description}-${m.image}`}>
                                        <b>{m.name}</b>
                                        {m.description && (
                                            <div style={{ marginTop: 4, fontSize: '0.9em', color: '#666' }}>
                                                {m.description}
                                            </div>
                                        )}
                                        {m.image && (
                                            <div style={{ marginTop: 6 }}>
                                                <img
                                                    src={m.image}
                                                    alt={m.name}
                                                    style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 4, objectFit: 'cover' }}
                                                />
                                            </div>
                                        )}
                                        <div style={{ marginTop: 6 }}>
                                            <small>{m.lat.toFixed(5)}, {m.lng.toFixed(5)}</small>
                                        </div>
                                        <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                            <button onClick={(e) => { e.stopPropagation(); dispatch(setEditingMarkerId(m.id)); }}>✏️ Editar</button>
                                            <button onClick={(e) => { e.stopPropagation(); dispatch(removeActiveMarker(m.id)); }}>🗑️ Eliminar</button>
                                            <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps?layer=c&cbll=${m.lat},${m.lng}`, '_blank'); }}>👀 Street View</button>
                                            <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.windy.com/-Webcams/`, '_blank'); }}>📹 Cámaras</button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    })}
                </LayerGroup>
            </Pane>

            <MapClickAdder enabled={drawMode} onAdd={handleAddMarker} />
        </LeafletMapContainer>
    );
});

export default MapContainer;

