import { useState, useEffect, useRef } from 'react';
import '../../theme/CyberTheme.css';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setAgentName } from '../config/configSlice';
import EntitySubmissionForm from './EntitySubmissionForm';
import AnalysisCharts from '../analysis/AnalysisCharts';
import type { AnalysisResult } from '../analysis/PatternDetector';
import type { Entity } from '../analysis/EntityDatabase';


interface MissionControlProps {
    analysisResult: AnalysisResult | null;
    entities: Entity[];
    analysisBounds: any;
    news: any[];
    leyLines: any[]; // Prop for context capture
    activeMarkers: any[]; // Prop for context capture
    onOpenAnalytics?: () => void; // New optional prop
}

// Simulated User Data
interface ConnectedUser {
    id: string;
    name: string;
    status: 'online' | 'analyzing' | 'idle';
    location: string;
}

import { AnalysisHistoryService } from '../analysis/AnalysisHistoryService';

// ... existing imports ...

export default function MissionControl({ analysisResult, entities, analysisBounds, news, leyLines, activeMarkers, onOpenAnalytics }: MissionControlProps) {
    const dispatch = useAppDispatch();
    const agentName = useAppSelector(state => state.config.agentName);
    const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
    const [archiving, setArchiving] = useState(false);

    const lastSavedId = useRef<string | null>(null);

    useEffect(() => {
        const autoSave = async () => {
            if (analysisResult && lastSavedId.current !== JSON.stringify(analysisResult.locationContext)) {
                try {
                    await AnalysisHistoryService.saveAnalysis(analysisResult, {
                        markers: activeMarkers,
                        leyLines: leyLines,
                        bounds: analysisBounds,
                        news: news
                    });
                    lastSavedId.current = JSON.stringify(analysisResult.locationContext);
                    console.log("Analysis auto-archived");
                } catch (e) {
                    console.error("Auto-archive failed", e);
                }
            }
        };
        autoSave();
    }, [analysisResult, activeMarkers, leyLines, analysisBounds, news]);

    const handleArchive = async () => {
        if (!analysisResult) return;
        setArchiving(true);
        try {
            await AnalysisHistoryService.saveAnalysis(analysisResult, {
                markers: activeMarkers,
                leyLines: leyLines,
                bounds: analysisBounds,
                news: news
            });
        } catch (e) { console.error(e); }
        setTimeout(() => setArchiving(false), 1000);
    };

    useEffect(() => {
        // ... existing user simulation ...
        const users: ConnectedUser[] = [
            { id: '1', name: 'Agent Zero', status: 'online', location: 'Sector 7' },
            { id: '2', name: 'Watcher_01', status: 'analyzing', location: 'North Ridge' },
            { id: '3', name: 'GeoSeeker', status: 'idle', location: 'Base' },
        ];
        setConnectedUsers(users);

        const interval = setInterval(() => {
            // Randomly toggle status
            setConnectedUsers(prev => prev.map(u => ({
                ...u,
                status: Math.random() > 0.7 ? 'analyzing' : 'online'
            })));
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="mission-control" style={{ width: '100%' }}>
            {/* Header Removed - Managed by Layout */}

            <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* 0. Agent Identity */}
                <div className="cyber-panel" style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 className="cyber-title" style={{ fontSize: '0.9rem', marginBottom: '0' }}>ACTIVE AGENT PROFILING</h3>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                                className="cyber-button"
                                style={{ fontSize: '0.7rem', padding: '4px 10px', background: archiving ? 'var(--cyber-success)' : undefined }}
                                onClick={handleArchive}
                                disabled={!analysisResult || archiving}
                            >
                                {archiving ? 'ARCHIVED' : '💾 ARCHIVE'}
                            </button>
                            {onOpenAnalytics && (
                                <button
                                    className="cyber-button"
                                    style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                                    onClick={onOpenAnalytics}
                                >
                                    📊 VIEW
                                </button>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span className="data-label">CODENAME:</span>
                        <input
                            className="sci-fi-input"
                            style={{ flex: 1 }}
                            value={agentName}
                            onChange={(e) => dispatch(setAgentName(e.target.value))}
                        />
                    </div>
                    {/* Location Context Display */}
                    {analysisResult?.locationContext && (
                        <div style={{ marginTop: '10px', padding: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                            <div className="data-label" style={{ fontSize: '0.7rem', color: '#aaa' }}>ANALYSIS ZONE</div>
                            <div style={{ color: 'var(--cyber-text)', fontWeight: 'bold' }}>
                                {analysisResult.locationContext.name}
                            </div>
                            {analysisResult.locationContext.countryCodes.length > 1 && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--cyber-secondary)', marginTop: '2px' }}>
                                    Cross-Border: {analysisResult.locationContext.countryCodes.map(c => c.toUpperCase()).join(' - ')}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 1. Network Status (Connected Users) */}
                <div className="cyber-panel" style={{ padding: '10px' }}>
                    <h3 className="cyber-title" style={{ fontSize: '0.9rem', marginBottom: '10px' }}>NETWORK AGENTS</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {connectedUsers.map(user => (
                            <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '5px 8px', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: user.status === 'analyzing' ? 'var(--cyber-warning)' : 'var(--cyber-success)',
                                        boxShadow: `0 0 5px ${user.status === 'analyzing' ? 'var(--cyber-warning)' : 'var(--cyber-success)'}`
                                    }} />
                                    <span style={{ fontSize: '0.9rem' }}>{user.name}</span>
                                </div>
                                <span className="data-label">{user.status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Analysis Stats (If Available) */}
                {analysisResult && (
                    <div className="cyber-panel" style={{ padding: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                        <h3 className="cyber-title" style={{ fontSize: '0.9rem', marginBottom: '10px' }}>ANALYSIS METRICS</h3>

                        {/* Primary Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center', marginBottom: '15px' }}>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px' }}>
                                <div className="data-label">ENERGY</div>
                                <div className="data-value">{analysisResult.stats.energyLevel.toFixed(0)}</div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px' }}>
                                <div className="data-label">ANOMALY %</div>
                                <div className="data-value" style={{ color: analysisResult.stats.anomalyProbability > 50 ? 'var(--cyber-danger)' : 'var(--cyber-success)' }}>
                                    {analysisResult.stats.anomalyProbability.toFixed(0)}%
                                </div>
                            </div>
                        </div>

                        {/* Holistic Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '15px' }}>
                            <div className="metric-box" style={{ background: 'rgba(255,255,255,0.05)', padding: '8px' }}>
                                <div className="data-label" style={{ fontSize: '0.7rem' }}>HARMONY</div>
                                <div className="metric-bar-bg" style={{ height: 4, background: '#333', marginTop: 4 }}>
                                    <div style={{ width: `${analysisResult.stats.holistic.harmony}%`, height: '100%', background: 'var(--cyber-success)' }}></div>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>{analysisResult.stats.holistic.harmony.toFixed(0)}</div>
                            </div>
                            <div className="metric-box" style={{ background: 'rgba(255,255,255,0.05)', padding: '8px' }}>
                                <div className="data-label" style={{ fontSize: '0.7rem' }}>TENSION</div>
                                <div className="metric-bar-bg" style={{ height: 4, background: '#333', marginTop: 4 }}>
                                    <div style={{ width: `${analysisResult.stats.holistic.tension}%`, height: '100%', background: 'var(--cyber-warning)' }}></div>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>{analysisResult.stats.holistic.tension.toFixed(0)}</div>
                            </div>
                            <div className="metric-box" style={{ background: 'rgba(255,255,255,0.05)', padding: '8px' }}>
                                <div className="data-label" style={{ fontSize: '0.7rem' }}>RENEWAL</div>
                                <div className="metric-bar-bg" style={{ height: 4, background: '#333', marginTop: 4 }}>
                                    <div style={{ width: `${analysisResult.stats.holistic.renewal}%`, height: '100%', background: 'var(--cyber-primary)' }}></div>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>{analysisResult.stats.holistic.renewal.toFixed(0)}</div>
                            </div>
                            <div className="metric-box" style={{ background: 'rgba(255,255,255,0.05)', padding: '8px' }}>
                                <div className="data-label" style={{ fontSize: '0.7rem' }}>EMOTIONAL</div>
                                <div className="metric-bar-bg" style={{ height: 4, background: '#333', marginTop: 4 }}>
                                    <div style={{ width: `${analysisResult.stats.holistic.emotionalClimate}%`, height: '100%', background: '#d8ebf9' }}></div>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>{analysisResult.stats.holistic.emotionalClimate.toFixed(0)}</div>
                            </div>
                        </div>

                        {/* Data Source Integrity Indicators */}
                        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div className="data-label" style={{ fontSize: '0.7rem', color: '#666', marginBottom: '8px', letterSpacing: '1px' }}>SENSOR INTEGRITY</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: analysisResult.stats.astral ? 'var(--cyber-success)' : '#444' }}></div>
                                    <span style={{ fontSize: '0.65rem' }}>ASTRA_CORE</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--cyber-success)' }}></div>
                                    <span style={{ fontSize: '0.65rem' }}>ENV_COLLECTOR</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: news.length > 0 ? 'var(--cyber-secondary)' : 'var(--cyber-warning)' }}></div>
                                    <span style={{ fontSize: '0.65rem' }}>INTEL_STREAM</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: analysisResult.patterns.length > 0 ? 'var(--cyber-success)' : '#444' }}></div>
                                    <span style={{ fontSize: '0.65rem' }}>GEOMETRIC_ENGINE</span>
                                </div>
                            </div>
                        </div>

                        {/* Planetary Alignment */}
                        {analysisResult.stats.planetary && (
                            <div style={{ background: 'rgba(0, 50, 50, 0.4)', padding: '10px', marginBottom: '15px', border: '1px solid var(--cyber-primary)' }}>
                                <div className="data-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                    <span>🌍</span> PLANETARY ALIGNMENT
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div>
                                        <div style={{ fontSize: '1.2rem', color: 'var(--cyber-primary)', fontWeight: 'bold' }}>
                                            {analysisResult.stats.planetary.schumannHz} Hz
                                        </div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>SCHUMANN RESONANCE</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1rem', color: analysisResult.stats.planetary.schumannState === 'Stable' ? 'var(--cyber-success)' : 'var(--cyber-warning)' }}>
                                            {analysisResult.stats.planetary.schumannState.toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>STATUS</div>
                                    </div>
                                </div>

                                <div className="hud-line" style={{ opacity: 0.3, margin: '5px 0' }}></div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                    <span>Seismic Activity:</span>
                                    <span>{analysisResult.stats.planetary.seismicActivity.count} Events</span>
                                </div>
                                {analysisResult.stats.planetary.seismicActivity.maxMagnitude > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                        <span>Max Magnitude:</span>
                                        <span style={{ color: analysisResult.stats.planetary.seismicActivity.maxMagnitude > 5 ? 'var(--cyber-warning)' : 'inherit' }}>
                                            M {analysisResult.stats.planetary.seismicActivity.maxMagnitude}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Astral Context */}
                        {analysisResult.stats.astral && (
                            <div style={{ background: 'rgba(100, 150, 255, 0.1)', padding: '10px', marginBottom: '15px', border: '1px solid rgba(100, 150, 255, 0.2)' }}>
                                <div className="data-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>🌙</span> ASTRAL CONTEXT
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                                    <div style={{ color: 'var(--cyber-primary)', fontWeight: 'bold' }}>
                                        {analysisResult.stats.astral.moonPhase.toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                        Illumination: {analysisResult.stats.astral.moonIllumination}%
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.7rem', marginTop: '3px', fontStyle: 'italic', opacity: 0.7 }}>
                                    Influence: {analysisResult.stats.astral.moonSentiment}
                                </div>
                            </div>
                        )}

                        {/* Entity List */}
                        {entities.length > 0 && (
                            <div style={{ marginBottom: '15px' }}>
                                <div className="data-label" style={{ marginBottom: '5px' }}>DETECTED ENTITIES</div>
                                {entities.map((e, idx) => (
                                    <div key={idx} style={{
                                        borderLeft: `2px solid ${e.alignment === 'dark' ? 'var(--cyber-danger)' : 'var(--cyber-success)'}`,
                                        background: 'rgba(0,0,0,0.2)', padding: '8px', marginBottom: '5px'
                                    }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{e.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{e.type} • {e.confidence}% Conf.</div>
                                        {e.description && <div style={{ fontSize: '0.75rem', marginTop: '2px', fontStyle: 'italic' }}>"{e.description}"</div>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Semantic Diagnosis */}
                        <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderLeft: '2px solid var(--cyber-primary)' }}>
                            <div className="data-label" style={{ marginBottom: '5px' }}>ASTRAL DIAGNOSIS</div>
                            <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                                {analysisResult.stats.holistic.tension > 60 && (
                                    <div style={{ color: 'var(--cyber-danger)', marginBottom: '4px' }}>⚠️ <b>CRITICAL CHAOS:</b> High volatility detected. Reality stabilizers recommended.</div>
                                )}
                                {analysisResult.stats.holistic.harmony < 30 && (
                                    <div style={{ color: 'var(--cyber-warning)', marginBottom: '4px' }}>🛡️ <b>OPPRESSION:</b> Heavy spiritual atmosphere. Standard protection protocols active.</div>
                                )}
                                {analysisResult.stats.holistic.emotionalClimate < 40 && (
                                    <div style={{ color: '#aaa', marginBottom: '4px' }}>🌫️ <b>DESPAIR:</b> Low emotional resonance. Field reports indicate gloom.</div>
                                )}
                                {analysisResult.stats.holistic.tension <= 60 && analysisResult.stats.holistic.harmony >= 30 && (
                                    <div style={{ color: 'var(--cyber-success)' }}>✅ <b>STABLE:</b> No major anomalies detected. Region is safe for traversal.</div>
                                )}
                            </div>
                        </div>

                        <div className="hud-line" />
                        {/* Charts */}
                        <div style={{ height: '300px' }}>
                            <AnalysisCharts patterns={analysisResult.patterns} entities={entities} bounds={analysisBounds} />
                        </div>
                    </div>
                )}

                {/* 3. News Feed */}
                <div className="cyber-panel" style={{ padding: '10px' }}>
                    <h3 className="cyber-title" style={{ fontSize: '0.9rem', marginBottom: '10px' }}>INTEL FEED</h3>
                    {news.length === 0 ? (
                        <div className="data-label" style={{ textAlign: 'center', padding: '20px' }}>NO DATA STREAM</div>
                    ) : (
                        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {news.map((item, i) => (
                                <div key={i} style={{ borderLeft: '2px solid var(--cyber-secondary)', paddingLeft: '10px' }}>
                                    <a href={item.url} target="_blank" rel="noreferrer" style={{ color: 'var(--cyber-text)', textDecoration: 'none', display: 'block', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                        {item.title}
                                    </a>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                        <span className="data-label">{item.source}</span>
                                        <span className="data-label">{item.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 4. Entity Submission */}
                <EntitySubmissionForm />

            </div>
        </div >
    );
}
