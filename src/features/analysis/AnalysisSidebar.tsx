import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setAnalysisMode, setShowHeatmap, setAnalysisResult } from '../map/mapSlice';
import { detectPatterns, type PatternResult } from './PatternDetector';
import type { NewsItem } from './types';
import { searchEntities, type Entity } from './EntityDatabase';
import { generateOsintLinks, generateDeepForensicsLinks } from './SocialService';
import './AnalysisSidebar.css';

import { useNavigate } from 'react-router-dom';
import { generateReport } from './ReportGenerator';
import AnalysisCharts from './AnalysisCharts';
import CollectiveSentiment from './CollectiveSentiment';
import { AnalysisHistoryService } from './AnalysisHistoryService';

export default function AnalysisSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { analysisMode, analysisBounds, leyLines, activeMarkers, showHeatmap } = useAppSelector((state) => state.map);

    const config = useAppSelector((state) => state.config);

    const [patterns, setPatterns] = useState<PatternResult[]>([]);
    const [news, setNews] = useState<NewsItem[]>([]);
    const [entities, setEntities] = useState<Entity[]>([]);
    const [locationContext, setLocationContext] = useState<{ name: string, countryCode: string } | null>(null);
    const [diagnosis, setDiagnosis] = useState<string>("");
    const [dateFrom, setDateFrom] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = useState<string>(new Date().toISOString().split('T')[0]);
    const [extraKeywords, setExtraKeywords] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [fullAnalysis, setFullAnalysis] = useState<any>(null);

    const handleDetectPatterns = async () => {
        if (!analysisBounds) return;
        setLoading(true);
        try {
            const results = await detectPatterns(leyLines, analysisBounds, {
                ...config,
                dateFrom,
                dateTo,
                extraKeywords
            }, activeMarkers);
            setPatterns(results.patterns);
            setNews(results.news);
            setEntities(results.entities); // Explicitly sync entities from detectPatterns result
            setFullAnalysis(results);
            dispatch(setAnalysisResult(results)); // Sync with Redux for Map layers (Heatmap, etc)
            if (results.locationContext) setLocationContext(results.locationContext);
            if (results.diagnosis) setDiagnosis(results.diagnosis);
        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchEntities = () => {
        if (!analysisBounds) return;
        setLoading(true);
        setTimeout(async () => {
            const results = await searchEntities(analysisBounds);
            setEntities(results);

            // Partially update Redux state for entities if fullAnalysis exists
            if (fullAnalysis) {
                const updated = { ...fullAnalysis, entities: results };
                setFullAnalysis(updated);
                dispatch(setAnalysisResult(updated));
            } else {
                // If it's a standalone search, create a partial result
                dispatch(setAnalysisResult({
                    entities: results,
                    patterns: [],
                    news: [],
                    social: [],
                    stats: {
                        energyLevel: 0,
                        anomalyProbability: 0,
                        vibration: 0,
                        holistic: { harmony: 50, tension: 0, collaboration: 0, renewal: 0, emotionalClimate: 50 }
                    }
                } as any));
            }

            setLoading(false);
        }, 1500);
    };

    const handleGenerateReport = () => {
        generateReport(patterns, entities, news, analysisBounds, activeMarkers, leyLines, diagnosis, { from: dateFrom, to: dateTo }, fullAnalysis);
    };

    const handleSaveHistory = async () => {
        if (!fullAnalysis || !analysisBounds) return;
        try {
            await AnalysisHistoryService.saveAnalysis(fullAnalysis, {
                markers: activeMarkers,
                leyLines: leyLines,
                bounds: analysisBounds,
                news: news
            });
            alert("✅ Análisis guardado en el historial local.");
        } catch (error) {
            console.error("Failed to save history:", error);
            alert("❌ Error al guardar en el historial.");
        }
    };

    const handleExportJson = () => {
        if (!fullAnalysis) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullAnalysis, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `analysis_${Date.now()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className={`analysis-sidebar ${isOpen ? 'open' : 'closed'}`}>
            <button className="toggle-btn" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? 'Cerrar Análisis' : '🔮 Análisis Espiritual'}
            </button>

            {isOpen && (
                <div className="content">
                    <h3>Análisis Espiritual</h3>

                    <CollectiveSentiment />

                    <div className="tool-section">
                        <button
                            onClick={() => dispatch(setAnalysisMode(analysisMode === 'box' ? 'none' : 'box'))}
                            className={analysisMode === 'box' ? 'active' : ''}
                        >
                            {analysisMode === 'box' ? '🛑 Cancelar Box' : '📐 Definir Área (Box)'}
                        </button>

                        <button
                            onClick={() => dispatch(setShowHeatmap(!showHeatmap))}
                            className={showHeatmap ? 'active' : ''}
                            style={{ borderColor: '#ff6b6b', color: showHeatmap ? 'white' : '#ff6b6b' }}
                        >
                            {showHeatmap ? '🔥 Ocultar Mapa de Calor' : '🔥 Ver Mapa de Calor'}
                        </button>

                        <button disabled={!analysisBounds || loading} onClick={handleDetectPatterns}>
                            {loading ? 'Procesando...' : '🔍 Detectar Patrones'}
                        </button>
                        <button disabled={!analysisBounds || loading} onClick={handleSearchEntities}>
                            {loading ? 'Buscando...' : '👹 Buscar Entidades'}
                        </button>
                        <button
                            disabled={patterns.length === 0 && entities.length === 0}
                            onClick={() => {
                                handleGenerateReport();
                                navigate('/report');
                            }}
                            style={{ marginTop: 10, borderColor: '#00c176', color: '#00c176' }}
                        >
                            📄 Ver Reporte Profesional
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                            <button
                                disabled={!fullAnalysis}
                                onClick={handleSaveHistory}
                                style={{ borderColor: '#4d9fec', color: '#4d9fec', fontSize: '0.85rem' }}
                            >
                                💾 Guardar Historial
                            </button>
                            <button
                                disabled={!fullAnalysis}
                                onClick={handleExportJson}
                                style={{ borderColor: '#ffb900', color: '#ffb900', fontSize: '0.85rem' }}
                            >
                                📤 Exportar JSON
                            </button>
                        </div>
                    </div>

                    <div className="search-config-panel">
                        <h4>⚙️ Configuración de Búsqueda</h4>
                        <div className="date-range-grid">
                            <div className="input-field">
                                <label>Desde:</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>
                            <div className="input-field">
                                <label>Hasta:</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>
                        </div>
                        <p className="help-text">Rango de fechas para correlación histórica de noticias y entidades.</p>

                        <div className="input-field" style={{ marginTop: 10 }}>
                            <label>Pistas / Palabras Clave Extra:</label>
                            <input
                                type="text"
                                placeholder="Ej: nombre de secta, suceso local..."
                                value={extraKeywords}
                                onChange={(e) => setExtraKeywords(e.target.value)}
                                className="extra-keywords-input"
                            />
                        </div>
                        <p className="help-text">Claves específicas para forzar al Scraper a buscar inteligencia profunda.</p>
                    </div>

                    <div className="results-section">
                        {(patterns.length > 0 || entities.length > 0) && (
                            <AnalysisCharts
                                patterns={patterns}
                                entities={entities}
                                bounds={analysisBounds}
                            />
                        )}

                        {patterns.length > 0 && (
                            <div className="result-block">
                                <h4>Patrones Detectados</h4>
                                <ul>
                                    {patterns.map((p, i) => (
                                        <li key={i}>
                                            <b>{p.type}</b>: {p.description}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {entities.length > 0 && (
                            <div className="result-block">
                                <h4>Entidades Detectadas</h4>
                                <ul>
                                    {entities.map((e) => (
                                        <li key={e.id}>
                                            <div className="entity-header">
                                                <b>{e.name}</b> <span className="entity-type">({e.type})</span>
                                            </div>
                                            <div className="entity-meta" style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', opacity: 0.8, marginBottom: '5px' }}>
                                                {e.coordinates && (
                                                    <span className="entity-coords">📍 {e.coordinates[0].toFixed(5)}, {e.coordinates[1].toFixed(5)}</span>
                                                )}
                                                {e.confidence && (
                                                    <span className="entity-confidence" style={{ color: '#00c176' }}>⚡ Confianza: {e.confidence}%</span>
                                                )}
                                            </div>
                                            <p><small>{e.description}</small></p>
                                            {e.biblicalReference && <p><i>Ref: {e.biblicalReference}</i></p>}

                                            <div className="osint-actions">
                                                <span>🕵️ Inteligencia Espiritual (OSINT):</span>
                                                <div className="osint-buttons">
                                                    {generateOsintLinks(e, "Area Actual").map((link, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={link.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title={link.label}
                                                            className="osint-btn"
                                                        >
                                                            {link.icon}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {(patterns.length > 0 || entities.length > 0) && (
                            <div className="result-block forensics-block">
                                <h4>🕵️ Forense Espiritual y Criminalística</h4>
                                <p className="help-text">Investigación profunda de la zona:</p>
                                <div className="forensics-grid">
                                    {generateDeepForensicsLinks("Zona Analizada").map((link, idx) => (
                                        <a
                                            key={idx}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="forensics-btn"
                                        >
                                            <span className="icon">{link.icon}</span>
                                            <span className="label">{link.label}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {fullAnalysis?.stats?.planetary && (
                            <div className="result-block planetary-block" style={{ borderColor: '#c56bff' }}>
                                <h4>🌌 Inteligencia Planetaria</h4>
                                <p><strong>Resonancia Schumann:</strong> {fullAnalysis.stats.planetary.schumannState}</p>
                                <p><strong>Sismicidad Reciente:</strong> {fullAnalysis.stats.planetary.seismicActivity?.count || 0} eventos</p>
                                {fullAnalysis.stats.astral && (
                                    <p><strong>Fase Lunar:</strong> {fullAnalysis.stats.astral.moonPhase} ({fullAnalysis.stats.astral.moonIllumination}%)</p>
                                )}
                            </div>
                        )}

                        {news.length > 0 && (
                            <div className="result-block news-block">
                                <h4>📰 Noticias y Eventos</h4>
                                <div className="news-list">
                                    {news.map((item, i) => (
                                        <div key={i} className={`news-item ${item.type === 'osint' ? 'osint-item' : ''} ${item.sentiment === 'high_tension' ? 'high-tension' : ''}`}>
                                            <div className="news-header">
                                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="news-title">
                                                    {item.title}
                                                </a>
                                                {item.type === 'osint' && <span className="osint-badge">OSINT</span>}
                                                {item.sentiment === 'high_tension' && <span className="tension-badge">ALTA TENSIÓN</span>}
                                            </div>
                                            {item.description && <p className="news-snippet">{item.description}</p>}
                                            <div className="news-meta">
                                                <span className="news-source">{item.source}</span>
                                                <span className="news-date">{item.date}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {locationContext && (
                            <div className="result-block location-block" style={{ borderColor: '#4d9fec' }}>
                                <h4>🌍 Contexto Geográfico</h4>
                                <p><strong>Zona:</strong> {locationContext.name}</p>
                                <p><strong>País Detectado:</strong> {locationContext.countryCode.toUpperCase()}</p>
                                <small style={{ opacity: 0.7 }}>* Noticias filtradas por esta ubicación.</small>
                            </div>
                        )}

                        {diagnosis && (
                            <div className="result-block diagnosis-block" style={{ borderColor: '#00c176', background: 'rgba(0, 193, 118, 0.05)' }}>
                                <h4>🔮 Diagnóstico Espiritual</h4>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{diagnosis}</p>
                            </div>
                        )}

                        {patterns.length === 0 && entities.length === 0 && !loading && (
                            <p className="muted">Define un área y ejecuta el análisis.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
