import { useAppDispatch, useAppSelector } from "../store/hooks";
import { resetMap } from "../features/map/mapSlice";
import tokml from "tokml";
import JSZip from "jszip";
import "./TopBar.css";

type Props = {
  onToggleSidebar: () => void;
};

export default function TopBar({ onToggleSidebar }: Props) {
  const dispatch = useAppDispatch();
  const { activeMarkers, leyLines } = useAppSelector((state) => state.map);

  const handleClear = () => {
    if (!confirm("Limpiar líneas y marcadores?")) return;
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
        properties: { name: m.name, description: m.description },
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

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-btn" onClick={onToggleSidebar}>☰</button>
        <div className="brand">
          <div className="brand-icon">☯</div>
          <div>
            <div className="brand-title">Ley Lines Explorer</div>
            <div className="brand-sub">Spiritual Mapping</div>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <button className="icon-btn" onClick={handleExport}>📦 Exportar</button>
        <button className="icon-btn" onClick={handleClear}>🧹 Limpiar</button>
      </div>
    </header>
  );
}
