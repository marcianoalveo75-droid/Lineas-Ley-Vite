import { useState, useEffect } from 'react';
import { Rectangle, useMapEvents, CircleMarker } from 'react-leaflet';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setAnalysisBounds, setAnalysisMode, setAnalysisResult } from './mapSlice';
import { LatLng } from 'leaflet';
import type { LeafletMouseEvent } from 'leaflet';

export default function BoundingBoxTool() {
    const dispatch = useAppDispatch();
    const { analysisMode, analysisBounds } = useAppSelector((state) => state.map);
    const [startPoint, setStartPoint] = useState<LatLng | null>(null);
    const [currentPoint, setCurrentPoint] = useState<LatLng | null>(null);

    const map = useMapEvents({
        click(e) {
            if (analysisMode !== 'box' || isMobile) return; // Disable click on mobile

            if (!startPoint) {
                setStartPoint(e.latlng);
                setCurrentPoint(e.latlng);
            } else {
                // Finish box
                const bounds: [[number, number], [number, number]] = [
                    [startPoint.lat, startPoint.lng],
                    [e.latlng.lat, e.latlng.lng]
                ];
                dispatch(setAnalysisBounds(bounds));
                setStartPoint(null);
                setCurrentPoint(null);
                dispatch(setAnalysisMode('none'));
            }
        },
        mousemove(e) {
            if (analysisMode === 'box' && startPoint && !isMobile) {
                setCurrentPoint(e.latlng);
            }
        }
    });

    // Mobile Center Box Logic
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleMobileConfirm = () => {
        const size = 300;
        const w = map.getSize().x;
        const h = map.getSize().y;

        const p1 = map.containerPointToLatLng([w / 2 - size / 2, h / 2 - size / 2]);
        const p2 = map.containerPointToLatLng([w / 2 + size / 2, h / 2 + size / 2]);

        const newBounds: [[number, number], [number, number]] = [
            [p1.lat, p1.lng],
            [p2.lat, p2.lng]
        ];

        dispatch(setAnalysisBounds(newBounds));
        dispatch(setAnalysisMode('none'));
    };

    const handleClearArea = () => {
        dispatch(setAnalysisBounds(null));
        dispatch(setAnalysisResult(null));
        dispatch(setAnalysisMode('box')); // Go back to drawing mode
    };

    const updateCorner = (index: number, lat: number, lng: number) => {
        if (!analysisBounds) return;
        const newBounds = [...analysisBounds] as [[number, number], [number, number]];

        if (index === 0) { // Corner 1 (lat1, lng1)
            newBounds[0] = [lat, lng];
        } else if (index === 1) { // Corner 2 (lat2, lng2)
            newBounds[1] = [lat, lng];
        } else if (index === 2) { // Corner 3 (lat1, lng2)
            newBounds[0] = [lat, newBounds[0][1]];
            newBounds[1] = [newBounds[1][0], lng];
        } else if (index === 3) { // Corner 4 (lat2, lng1)
            newBounds[1] = [lat, newBounds[1][1]];
            newBounds[0] = [newBounds[0][0], lng];
        }

        dispatch(setAnalysisBounds(newBounds));
    };

    if (analysisMode === 'box' && isMobile) {
        return (
            <>
                <div className="center-selection-box"></div>
                <button className="mobile-confirm-btn" onClick={handleMobileConfirm}>
                    ✅ CONFIRMAR ÁREA
                </button>
            </>
        );
    }

    const corners = analysisBounds ? [
        [analysisBounds[0][0], analysisBounds[0][1]], // SW
        [analysisBounds[1][0], analysisBounds[1][1]], // NE
        [analysisBounds[0][0], analysisBounds[1][1]], // NW
        [analysisBounds[1][0], analysisBounds[0][1]], // SE
    ] : [];

    return (
        <>
            {analysisBounds && (
                <>
                    <Rectangle
                        bounds={analysisBounds}
                        pathOptions={{ color: '#c56bff', weight: 2, fillOpacity: 0.1 }}
                    />
                    {/* Resizing Handles */}
                    {corners.map((pos, idx) => (
                        <CircleMarker
                            key={`handle-${idx}`}
                            center={[pos[0], pos[1]]}
                            radius={isMobile ? 15 : 8}
                            pathOptions={{ color: '#fff', weight: 2, fillColor: '#c56bff', fillOpacity: 0.8 }}
                            interactive={true}
                            eventHandlers={{
                                mousedown: () => map.dragging.disable(),
                                mouseup: () => map.dragging.enable(),
                                drag: (e: any) => {
                                    const { lat, lng } = e.target.getLatLng();
                                    updateCorner(idx, lat, lng);
                                },
                                // Touch support via dragging property if available or standard move
                                move: (e: any) => {
                                    if (e.originalEvent.buttons === 1 || e.originalEvent.touches) {
                                        const { lat, lng } = e.target.getLatLng();
                                        updateCorner(idx, lat, lng);
                                    }
                                }
                            }}
                        />
                    ))}
                    {/* Clear Button UI (Overlay) */}
                    <div style={{ position: 'absolute', top: 200, right: 20, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <button
                            className="cyber-button"
                            onClick={handleClearArea}
                            style={{ padding: '8px 15px', background: 'rgba(255,0,85,0.2)', border: '1px solid #ff0055', color: '#ff0055' }}
                        >
                            🗑️ ELIMINAR ÁREA
                        </button>
                    </div>
                </>
            )}

            {startPoint && currentPoint && !analysisBounds && (
                <Rectangle
                    bounds={[[startPoint.lat, startPoint.lng], [currentPoint.lat, currentPoint.lng]]}
                    pathOptions={{ color: '#c56bff', weight: 2, dashArray: '5, 5', fillOpacity: 0.1 }}
                />
            )}
        </>
    );
}
