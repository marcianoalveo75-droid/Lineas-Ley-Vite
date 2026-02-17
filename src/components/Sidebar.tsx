import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  setDrawMode,
  updateActiveMarker,
  removeActiveMarker,
  addLeyLine,
  updateLeyLine,
  deleteLeyLine,
  setLeyLines,
  addActiveMarker,
  type LeyLine,
  type MarkerData
} from "../features/map/mapSlice";
import { kml } from "@mapbox/togeojson";
import JSZip from "jszip";
import "./Sidebar.css";

type Props = {
  open: boolean;
};

const randColor = () => {
  const palette = ["#ff6b6b", "#4ea1ff", "#00c176", "#ffb400", "#c56bff"];
  return palette[Math.floor(Math.random() * palette.length)];
};

export default function Sidebar({ open }: Props) {
  const dispatch = useAppDispatch();
  const { activeMarkers, leyLines, drawMode } = useAppSelector((state) => state.map);

  const handleSaveLeyLine = () => {
    if (activeMarkers.length < 2) {
      alert("Añade al menos 2 puntos para guardar una línea ley.");
      return;
    }
    const newLine: LeyLine = {
      id: Date.now(),
      name: `Línea ${leyLines.length + 1}`,
      color: randColor(),
      markers: [...activeMarkers],
    };
    dispatch(addLeyLine(newLine));
    dispatch({ type: 'map/clearActiveMarkers' });
  };

  const handleEditActiveMarker = (id: number) => {
    const marker = activeMarkers.find((m) => m.id === id);
    if (!marker) return;
    const name = prompt("Nombre:", marker.name || "");
    const description = prompt("Descripción:", marker.description || "");
    dispatch(updateActiveMarker({ ...marker, name: name ?? marker.name, description: description ?? marker.description }));
  };

  const handleRenameLeyLine = (id: number) => {
    const line = leyLines.find((l) => l.id === id);
    if (!line) return;
    const name = prompt("Nuevo nombre:", line.name || "");
    if (!name) return;
    dispatch(updateLeyLine({ ...line, name }));
  };

  const handleRecolorLeyLine = (id: number) => {
    const line = leyLines.find((l) => l.id === id);
    if (!line) return;
    const color = prompt("Color (hex o nombre):", line.color || "#4ea1ff");
    if (!color) return;
    dispatch(updateLeyLine({ ...line, color }));
  };

  const processGeoJSON = (json: any) => {
    if (json.type === "FeatureCollection") {
      const newLines: LeyLine[] = [];
      const extraMarkers: MarkerData[] = [];
      json.features.forEach((feat: any) => {
        const geom = feat.geometry;
        if (!geom) return;
        if (geom.type === "LineString") {
          const pts = geom.coordinates.map((c: number[]) => ({ id: Date.now() + Math.floor(Math.random() * 100000), lat: c[1], lng: c[0], name: feat.properties?.name || "Imported" }));
          newLines.push({ id: Date.now() + Math.floor(Math.random() * 1000), name: feat.properties?.name || "Imported line", color: randColor(), markers: pts });
        } else if (geom.type === "Point") {
          const c = geom.coordinates;
          extraMarkers.push({ id: Date.now() + Math.floor(Math.random() * 100000), lat: c[1], lng: c[0], name: feat.properties?.name || "Imported point", description: feat.properties?.description });
        }
      });
      if (newLines.length) dispatch(setLeyLines([...leyLines, ...newLines]));
      if (extraMarkers.length) {
        extraMarkers.forEach(m => dispatch(addActiveMarker(m)));
      }
      alert("Archivo importado correctamente.");
    } else {
      alert("Formato no reconocido o sin datos válidos.");
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
          alert("No se encontró archivo KML dentro del KMZ.");
        }
      } else {
        alert("Formato no soportado. Usa .geojson, .json, .kml o .kmz");
      }
    } catch (err) {
      console.error(err);
      alert("Error leyendo archivo.");
    }
  };

  return (
    <aside className={`app-sidebar ${open ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <div>
          <div className="logo">Ley Lines Explorer</div>
          <div className="subtitle">Spiritual Mapping</div>
        </div>
      </div>

      <div className="sidebar-body">
        <div className="controls">
          <button className={`draw-btn ${drawMode ? "active" : ""}`} onClick={() => dispatch(setDrawMode(!drawMode))}>
            {drawMode ? "🛑 Salir dibujo" : "✏️ Dibujar línea"}
          </button>
          <button className="save-btn" onClick={handleSaveLeyLine}>💾 Guardar línea</button>
        </div>

        <div className="section">
          <h5>Puntos activos ({activeMarkers.length})</h5>
          <ul className="list">
            {activeMarkers.map((m) => (
              <li key={m.id} className="list-item">
                <div>
                  <b>{m.name}</b>
                  <div className="muted">{m.lat.toFixed(4)}, {m.lng.toFixed(4)}</div>
                </div>
                <div className="list-actions">
                  <button onClick={() => handleEditActiveMarker(m.id)}>✏️</button>
                  <button onClick={() => dispatch(removeActiveMarker(m.id))}>🗑️</button>
                </div>
              </li>
            ))}
            {activeMarkers.length === 0 && <p className="muted">No hay puntos activos</p>}
          </ul>
        </div>

        <div className="section">
          <h5>Líneas guardadas</h5>
          <ul className="list">
            {leyLines.length === 0 && <p className="muted">No hay líneas guardadas</p>}
            {leyLines.map((l) => (
              <li key={l.id} className="list-item">
                <div>
                  <span className="color-dot" style={{ background: l.color }} />
                  <b>{l.name}</b>
                  <div className="muted">{l.markers.length} puntos</div>
                </div>
                <div className="list-actions">
                  <button onClick={() => handleRenameLeyLine(l.id)}>✏️</button>
                  <button onClick={() => handleRecolorLeyLine(l.id)}>🎨</button>
                  <button onClick={() => dispatch(deleteLeyLine(l.id))}>🗑️</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="section">
          <h5>Importar Archivo</h5>
          <input type="file" accept=".geojson,.json,.kml,.kmz" onChange={(e) => handleLoadFile(e.target.files?.[0] || null)} />
          <small className="muted" style={{ display: 'block', marginTop: 5 }}>Soporta GeoJSON, KML, KMZ</small>
        </div>
      </div>

      <div className="sidebar-footer">Tip: activa "Dibujar línea" para añadir puntos en el mapa.</div>
    </aside>
  );
}
