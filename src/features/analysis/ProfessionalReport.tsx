import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setAnalysisResult, setAnalysisBounds } from '../map/mapSlice';
import AnalysisCharts from './AnalysisCharts';
import MapContainer from '../map/MapContainer'; // Re-using map for geospatial visualization
import { AnalysisHistoryService, type AnalysisRecord } from './AnalysisHistoryService';
import { generateReport } from './ReportGenerator';
import html2canvas from 'html2canvas';
import './ProfessionalReport.css';

export default function ProfessionalReport() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const reportRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const analysisResult = useAppSelector(state => state.map.analysisResult);
    const [history, setHistory] = useState<AnalysisRecord[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const loadHistory = async () => {
            const h = await AnalysisHistoryService.getAll();
            setHistory(h);
        };
        loadHistory();
    }, [analysisResult]);

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target?.result as string);
                if (importedData.stats && importedData.patterns) {
                    dispatch(setAnalysisResult(importedData));
                    if (importedData.bounds) {
                        dispatch(setAnalysisBounds(importedData.bounds));
                    }
                } else {
                    alert("Formato de archivo .LEY inválido");
                }
            } catch (err) {
                alert("Error al leer el archivo");
            }
        };
        reader.readAsText(file);
    };

    const loadFromHistory = (record: AnalysisRecord) => {
        dispatch(setAnalysisResult(record));
        if (record.bounds) {
            dispatch(setAnalysisBounds(record.bounds));
        }
        setShowHistory(false);
    };

    if (!analysisResult) {
        return (
            <div className="report-page loading">
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".ley"
                    onChange={handleImportFile}
                />
                <button className="back-btn" onClick={() => navigate('/')}>← Volver</button>
                <div className="cyber-panel" style={{ padding: '40px', textAlign: 'center' }}>
                    <h2>SIN DATOS DE ANÁLISIS</h2>
                    <p style={{ marginBottom: 20 }}>Por favor, realiza un escaneo previo en el mapa o importa un reporte.</p>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="cyber-button" onClick={() => fileInputRef.current?.click()}>
                            📂 CARGAR (.LEY)
                        </button>
                        <button className="cyber-button secondary" onClick={() => setShowHistory(true)}>
                            📜 HISTORIAL ({history.length})
                        </button>
                    </div>

                    {showHistory && (
                        <div className="history-overlay no-print" onClick={() => setShowHistory(false)}>
                            <div className="history-panel" onClick={e => e.stopPropagation()}>
                                <h3>HISTORIAL DE ESCANEOS</h3>
                                <div className="history-list">
                                    {history.map(item => (
                                        <div key={item.id} className="history-item" onClick={() => loadFromHistory(item)}>
                                            <div className="h-zone">{item.zoneName}</div>
                                            <div className="h-meta">{new Date(item.timestamp).toLocaleString()}</div>
                                        </div>
                                    ))}
                                    {history.length === 0 && <p>No hay reportes guardados.</p>}
                                </div>
                                <button className="cyber-button" style={{ width: '100%', marginTop: 20 }} onClick={() => setShowHistory(false)}>CERRAR</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const { stats, locationContext, patterns, entities, news, bounds, diagnosis, markers, leyLines } = analysisResult;

    const exportToPDF = async () => {
        if (!analysisResult) return;
        setIsExporting(true);
        try {
            // Capture map and charts
            const mapElement = document.querySelector('.report-map-snapshot');
            const chartsElement = document.querySelector('.charts-grid-report');

            let mapImage = "";
            let chartsImage = "";

            if (mapElement) {
                const canvas = await html2canvas(mapElement as HTMLElement, {
                    useCORS: true,
                    backgroundColor: '#050a14',
                    scale: 2 // Higher quality
                });
                mapImage = canvas.toDataURL('image/png');
            }

            if (chartsElement) {
                const canvas = await html2canvas(chartsElement as HTMLElement, {
                    useCORS: true,
                    backgroundColor: '#050a14',
                    scale: 2
                });
                chartsImage = canvas.toDataURL('image/png');
            }

            await generateReport(
                analysisResult.patterns,
                analysisResult.entities,
                analysisResult.news,
                analysisResult.bounds || null,
                analysisResult.markers,
                analysisResult.leyLines,
                analysisResult.diagnosis,
                analysisResult.dateRange,
                analysisResult,
                analysisResult.social,
                { mapImage, chartsImage }
            );
        } catch (err) {
            console.error("PDF Export failed", err);
            alert("Error al generar el PDF con imágenes.");
        } finally {
            setIsExporting(false);
        }
    };

    const exportToLey = () => {
        const dataStr = JSON.stringify(analysisResult);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `report-${locationContext?.name || 'zone'}.ley`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    return (
        <div className="report-page" ref={reportRef}>
            <div className="report-actions-top no-print">
                <button className="cyber-button" onClick={() => navigate('/')}>← VOLVER AL MENÚ</button>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="cyber-button" onClick={() => setShowHistory(true)}>📜 HISTORIAL</button>
                    <button className="cyber-button secondary" onClick={exportToLey}>💾 COMPARTIR (.LEY)</button>
                    <button className="energy-btn" onClick={exportToPDF} disabled={isExporting}>
                        {isExporting ? '⌛ PROCESANDO...' : '📄 EXPORTAR PDF'}
                    </button>
                </div>
            </div>

            {showHistory && (
                <div className="history-overlay no-print" onClick={() => setShowHistory(false)}>
                    <div className="history-panel" onClick={e => e.stopPropagation()}>
                        <h3>HISTORIAL DE ESCANEOS</h3>
                        <div className="history-list">
                            {history.filter(h => h.timestamp !== (analysisResult as any)?.timestamp).map(item => (
                                <div key={item.id} className="history-item" onClick={() => loadFromHistory(item)}>
                                    <div className="h-zone">{item.zoneName}</div>
                                    <div className="h-meta">{new Date(item.timestamp).toLocaleString()}</div>
                                </div>
                            ))}
                            {history.length <= 1 && <p>No hay más reportes guardados.</p>}
                        </div>
                        <button className="cyber-button" style={{ width: '100%', marginTop: 20 }} onClick={() => setShowHistory(false)}>CERRAR</button>
                    </div>
                </div>
            )}

            <div className="report-container">
                <header className="report-header">
                    <div className="report-badge">LEY LINES QUANTUM SCAN</div>
                    <h1 className="report-title">{locationContext?.name || "Zona de Análisis"}</h1>
                    <div className="report-meta">
                        <span>FECHA: {new Date().toLocaleDateString()}</span>
                        {analysisResult.dateRange?.from && (
                            <span className="analysis-period">
                                PERIODO: {new Date(analysisResult.dateRange.from).toLocaleDateString()} - {new Date(analysisResult.dateRange.to).toLocaleDateString()}
                            </span>
                        )}
                        <span>CO: {locationContext?.countryCode.toUpperCase()}</span>
                        <span>ID: LEY-SCAN-{Math.floor(Math.random() * 900000 + 100000)}</span>
                    </div>
                </header>

                <div className="report-main-grid">
                    {/* Executive Summary */}
                    <div className="report-section full-width">
                        <div className="stats-gauges">
                            <div className="gauge-item">
                                <div className="gauge-label">ENERGÍA</div>
                                <div className="gauge-value">{stats.energyLevel.toFixed(1)}%</div>
                                <div className="gauge-bar"><div style={{ width: `${stats.energyLevel}%` }}></div></div>
                            </div>
                            <div className="gauge-item">
                                <div className="gauge-label">ANOMALÍA</div>
                                <div className="gauge-value">{stats.anomalyProbability.toFixed(1)}%</div>
                                <div className="gauge-bar danger"><div style={{ width: `${stats.anomalyProbability}%` }}></div></div>
                            </div>
                            <div className="gauge-item">
                                <div className="gauge-label">VIBRACIÓN</div>
                                <div className="gauge-value">{stats.vibration.toFixed(1)} Hz</div>
                                <div className="gauge-bar glow"><div style={{ width: `${Math.min(100, (stats.vibration / 150) * 100)}%` }}></div></div>
                            </div>
                        </div>
                    </div>

                    {/* Geospatial Context */}
                    <div className="report-section">
                        <h3 className="section-title">CONTEXTO GEOPATÓGENO</h3>
                        <div className="report-map-snapshot">
                            {/* We use MapContainer in a read-only or static-like mode */}
                            <MapContainer />
                        </div>
                        <div className="data-table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Patrón</th>
                                        <th>Descripción</th>
                                        <th>Coord.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {patterns.map((p, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 'bold' }}>{p.type}</td>
                                            <td>{p.description}</td>
                                            <td className="coord-cell">{p.coordinates[0]?.map(c => c.toFixed(3)).join(', ')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Entities Section */}
                    <div className="report-section">
                        <h3 className="section-title">ENTIDADES E INFLUENCIAS</h3>
                        <div className="entities-report-list">
                            {entities.length > 0 ? entities.map((e, i) => (
                                <div key={i} className="entity-report-item" style={{ borderLeft: `3px solid ${e.alignment === 'dark' ? '#ff0055' : '#00ffd9'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <b style={{ color: e.alignment === 'dark' ? '#ff0055' : '#00ffd9' }}>{e.name}</b>
                                        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{e.type}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', marginTop: '5px' }}>{e.description}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.5, fontStyle: 'italic', marginTop: '3px' }}>
                                        Confianza: {e.confidence}% • Influencia: {e.influence}
                                    </div>
                                </div>
                            )) : <div className="no-data">No se identificaron entidades específicas en esta sesión.</div>}
                        </div>
                    </div>

                    {/* Technical Charts */}
                    <div className="report-section full-width">
                        <h3 className="section-title">ANALÍTICAS DE CAMPO E INTELIGENCIA CUÁNTICA</h3>
                        <div className="charts-grid-report">
                            <AnalysisCharts
                                patterns={patterns}
                                entities={entities}
                                bounds={bounds || null}
                                stats={stats}
                            />
                        </div>
                    </div>

                    {/* Detailed Signal Inventory */}
                    <div className="report-section">
                        <h3 className="section-title">DETALLE DE SEÑALES (MARCADORES)</h3>
                        <div className="data-table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Coordenadas</th>
                                        <th>Descripción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(markers || []).map((m, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 'bold' }}>{m.name || `Marcador ${i + 1}`}</td>
                                            <td className="coord-cell">{m.lat.toFixed(6)}, {m.lng.toFixed(6)}</td>
                                            <td style={{ fontSize: '0.85rem', opacity: 0.8 }}>{m.description || '---'}</td>
                                        </tr>
                                    ))}
                                    {(markers || []).length === 0 && (
                                        <tr>
                                            <td colSpan={3} style={{ textAlign: 'center', opacity: 0.5 }}>No hay marcadores individuales registrados.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Network Topology (Ley Lines) */}
                    <div className="report-section">
                        <h3 className="section-title">TOPOLOGÍA DE RED (LÍNEAS LEY)</h3>
                        <div className="data-table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID Red</th>
                                        <th>Nodos</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(leyLines || []).map((line, i) => (
                                        <tr key={i}>
                                            <td style={{ color: line.color, fontWeight: 'bold' }}>{line.name}</td>
                                            <td>{line.markers.length} Nodos</td>
                                            <td style={{ fontSize: '0.8rem' }}>Activa / {line.markers.length > 3 ? 'Estable' : 'Punto-a-Punto'}</td>
                                        </tr>
                                    ))}
                                    {(leyLines || []).length === 0 && (
                                        <tr>
                                            <td colSpan={3} style={{ textAlign: 'center', opacity: 0.5 }}>No se han trazado líneas de flujo en esta zona.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Environmental & Astral */}
                    <div className="report-section">
                        <h3 className="section-title">SENSORES PLANETARIOS</h3>
                        <div className="planetary-report-grid">
                            <div className="p-card">
                                <div className="p-icon">🌍</div>
                                <div className="p-data">
                                    <div className="p-label">Resonancia Schumann</div>
                                    <div className="p-val">{stats.planetary?.schumannHz || '7.83'} Hz</div>
                                    <div className="p-status">{stats.planetary?.schumannState || 'ESTABLE'}</div>
                                </div>
                            </div>

                            {stats.planetary?.seismicActivity && (
                                <div className="p-card seismic-highlight">
                                    <div className="p-icon">🌋</div>
                                    <div className="p-data">
                                        <div className="p-label">Sismicidad Local</div>
                                        <div className="p-val">{stats.planetary.seismicActivity.count} Eventos</div>
                                        <div className="p-status">Máx: {stats.planetary.seismicActivity.maxMagnitude} ML</div>
                                    </div>
                                </div>
                            )}

                            {stats.astral && (
                                <div className="p-card">
                                    <div className="p-icon">🌙</div>
                                    <div className="p-data">
                                        <div className="p-label">Fase Lunar: {stats.astral.moonPhase}</div>
                                        <div className="p-val">{(stats.astral.moonIllumination * 100).toFixed(0)}%</div>
                                        <div className="p-status">{stats.astral.moonSentiment}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {stats.planetary?.seismicActivity?.details && stats.planetary.seismicActivity.details.length > 0 && (
                            <div className="seismic-list-detailed">
                                <h4>ÚLTIMOS SISMOS REGISTRADOS</h4>
                                <div className="quake-table-mini">
                                    {stats.planetary.seismicActivity.details.map((q: any, i: number) => (
                                        <div key={i} className="quake-row">
                                            <span className="q-mag">{q.mag}</span>
                                            <span className="q-place">{q.place}</span>
                                            <span className="q-time">{new Date(q.time).toLocaleTimeString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* News & Intelligence */}
                    <div className="report-section">
                        <h3 className="section-title">FEED DE INTELIGENCIA (NOTICIAS)</h3>
                        <div className="intel-feed-report">
                            {news.length > 0 ? news.map((n, i) => (
                                <div key={i} className="intel-item">
                                    <span className={`sentiment-dot ${n.sentiment}`}></span>
                                    <div className="intel-info">
                                        <div className="intel-title">{n.title}</div>
                                        <div className="intel-meta">{n.source} • {new Date(n.date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            )) : <div className="no-data">No se recolectaron noticias significativas.</div>}
                        </div>
                    </div>

                    {/* Holistic Diagnosis */}
                    <div className="report-section full-width diagnosis-final">
                        <h3 className="section-title">DIAGNÓSTICO HOLÍSTICO INTEGRAL</h3>
                        <div className="final-diagnosis-box">
                            {diagnosis}
                        </div>
                        <div className="collective-stats-report">
                            <div className="c-stat"><span>ARMONÍA:</span> <b>{stats.holistic.harmony}%</b></div>
                            <div className="c-stat"><span>TENSIÓN:</span> <b>{stats.holistic.tension}%</b></div>
                            <div className="c-stat"><span>RENOVACIÓN:</span> <b>{stats.holistic.renewal}%</b></div>
                            <div className="c-stat"><span>CLIMA:</span> <b>{stats.holistic.emotionalClimate}%</b></div>
                        </div>
                    </div>
                </div>

                <footer className="report-footer">
                    <p>Este reporte ha sido generado por el motor de análisis cuántico de Ley Lines PWA.</p>
                    <p>© 2026 LEY LINES PROTOCOL • NO PARA USO MÉDICO</p>
                </footer>
            </div>
        </div>
    );
}
