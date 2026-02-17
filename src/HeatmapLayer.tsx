import { useEffect } from "react";
import { useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet.heat";

interface HeatmapLayerProps {
  points: [number, number, number?][];
}

export default function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    const heatLayer = (L as any).heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.4: "blue", 0.65: "lime", 1: "red" },
    }).addTo(map);

    return () => {
      heatLayer.remove();
    };
  }, [map, points]);

  return null;
}
