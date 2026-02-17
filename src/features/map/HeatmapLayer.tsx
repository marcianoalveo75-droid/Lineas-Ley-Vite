import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { useAppSelector } from '../../store/hooks';

export default function HeatmapLayer() {
    const map = useMap();
    const { leyLines, activeMarkers, showHeatmap, analysisResult, analysisBounds } = useAppSelector((state) => state.map);

    useEffect(() => {
        if (!showHeatmap) return;

        // Ensure L.heatLayer is available
        if (!(L as any).heatLayer) {
            console.error("Leaflet.heat plugin not loaded properly");
            return;
        }

        // Collect points from lines, markers, and ENTITIES
        const points: [number, number, number][] = [];

        // 0. Base Energy (Center of analysis - Always show something)
        if (analysisBounds) {
            const centerLat = (analysisBounds[0][0] + analysisBounds[1][0]) / 2;
            const centerLng = (analysisBounds[0][1] + analysisBounds[1][1]) / 2;
            points.push([centerLat, centerLng, 0.5]); // Moderate base energy
        }

        // 1. Saved Ley Lines (Past records - Medium intensity)
        leyLines.forEach(line => {
            line.markers.forEach(m => points.push([m.lat, m.lng, 0.4]));
        });

        // 2. Active Markers (Working area - High intensity)
        activeMarkers.forEach(m => points.push([m.lat, m.lng, 0.7]));

        // 3. Spiritual Entities (Intense energy spots)
        if (analysisResult?.entities) {
            analysisResult.entities.forEach(e => {
                if (e.coordinates) {
                    points.push([e.coordinates[0], e.coordinates[1], 0.9]); // Very high intensity
                }
            });
        }

        // @ts-ignore
        const heat = (L as any).heatLayer(points, {
            radius: 40,
            blur: 15,
            max: 1.0,
            gradient: { 0.2: '#00f0ff', 0.5: '#ff00ff', 0.9: '#ffeb3b' }
        });
        heat.addTo(map);

        return () => {
            map.removeLayer(heat);
        };
    }, [map, leyLines, activeMarkers, showHeatmap, analysisResult]);

    return null;
}
