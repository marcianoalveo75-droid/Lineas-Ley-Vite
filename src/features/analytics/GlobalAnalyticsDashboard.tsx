import { useEffect, useState } from 'react';
import '../../theme/CyberTheme.css';
import { AnalysisHistoryService, type AnalysisRecord } from '../analysis/AnalysisHistoryService';
import { CollectiveService } from '../collective/CollectiveService';
import type { CollectiveState } from '../collective/CollectiveSchema';
import EmotionalOcean from '../collective/visualizations/EmotionalOcean';
import EnergyField from '../collective/visualizations/EnergyField';

import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';
import { Radar, Line } from 'react-chartjs-2';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

export default function GlobalAnalyticsDashboard({ onClose }: { onClose: () => void }) {
    const [history, setHistory] = useState<AnalysisRecord[]>([]);
    const [collectiveState, setCollectiveState] = useState<CollectiveState | null>(null);
    const [activeTab, setActiveTab] = useState<'analytics' | 'collective'>('analytics');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await AnalysisHistoryService.getAll();
        setHistory(data);

        // Initialize Collective Service mock data if empty
        const latest = await CollectiveService.getLatestState();
        if (!latest) {
            await CollectiveService.generateMockData();
            await CollectiveService.updateCollectiveState();
        }
        const state = await CollectiveService.getLatestState();
        setCollectiveState(state || null);
    };

    // --- AGGREGATION LOGIC ---
    const totalScans = history.length;
    const avgEnergy = history.reduce((acc, curr) => acc + curr.stats.energyLevel, 0) / (totalScans || 1);
    const avgVibration = history.reduce((acc, curr) => acc + curr.stats.vibration, 0) / (totalScans || 1);

    // KPI: Anomaly Rate (scan with anomaly > 50%)
    const anomalies = history.filter(h => h.stats.anomalyProbability > 50).length;
    const anomalyRate = (anomalies / (totalScans || 1)) * 100;

    // CHART 1: Holistic Average (Radar)
    const holisticAvg = history.reduce((acc, curr) => ({
        harmony: acc.harmony + curr.stats.holistic.harmony,
        tension: acc.tension + curr.stats.holistic.tension,
        collaboration: acc.collaboration + curr.stats.holistic.collaboration,
        renewal: acc.renewal + curr.stats.holistic.renewal,
        emotionalClimate: acc.emotionalClimate + curr.stats.holistic.emotionalClimate
    }), { harmony: 0, tension: 0, collaboration: 0, renewal: 0, emotionalClimate: 0 });

    Object.keys(holisticAvg).forEach(k => holisticAvg[k as keyof typeof holisticAvg] /= (totalScans || 1));

    const radarData = {
        labels: ['Harmony', 'Tension', 'Collaboration', 'Renewal', 'Emotional'],
        datasets: [
            {
                label: 'Global Average',
                data: [holisticAvg.harmony, holisticAvg.tension, holisticAvg.collaboration, holisticAvg.renewal, holisticAvg.emotionalClimate],
                backgroundColor: 'rgba(0, 255, 255, 0.2)',
                borderColor: 'var(--cyber-primary)',
                borderWidth: 2,
            }
        ],
    };

    // CHART 2: Trend Line (Energy & Vibration over last 10 scans)
    const recentHistory = history.slice(0, 10).reverse(); // Last 10, chronological
    const trendData = {
        labels: recentHistory.map(h => new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
        datasets: [
            {
                label: 'Energy Level',
                data: recentHistory.map(h => h.stats.energyLevel),
                borderColor: 'var(--cyber-secondary)',
                backgroundColor: 'var(--cyber-secondary)',
                tension: 0.4
            },
            {
                label: 'Vibration',
                data: recentHistory.map(h => h.stats.vibration),
                borderColor: 'var(--cyber-success)',
                backgroundColor: 'var(--cyber-success)',
                tension: 0.4
            }
        ]
    };

    const exportData = () => {
        if (history.length === 0) return;

        // Convert to CSV
        const headers = ['Timestamp', 'Zone', 'Country', 'Vibration', 'Energy', 'SchumannState', 'MaxMagnitude', 'AnomalyProb'];
        const csvRows = [headers.join(',')];

        history.forEach(row => {
            const values = [
                new Date(row.timestamp).toISOString(),
                `"${row.locationContext?.name || ''}"`,
                `"${row.locationContext?.countryCode || ''}"`,
                row.stats.vibration,
                row.stats.energyLevel,
                row.stats.planetary?.schumannState || 'N/A',
                row.stats.planetary?.seismicActivity.maxMagnitude || 0,
                row.stats.anomalyProbability
            ];
            csvRows.push(values.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spiritual_analysis_export_${new Date().getTime()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);

    return (
        <div className="analytics-dashboard" style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'var(--cyber-background-dark)', zIndex: 2000,
            display: 'flex', flexDirection: 'column', color: 'var(--cyber-text)',
            overflow: 'hidden'
        }}>

            {/* DETAIL MODAL OVERLAY */}
            {selectedRecord && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', zIndex: 3000,
                    display: 'flex', flexDirection: 'column', padding: '20px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--cyber-primary)', paddingBottom: '10px' }}>
                        <div>
                            <div className="cyber-title" style={{ fontSize: '1.5rem' }}>ANALYSIS REPORT #{selectedRecord.id}</div>
                            <div style={{ color: 'var(--cyber-text-muted)' }}>{new Date(selectedRecord.timestamp).toLocaleString()}</div>
                        </div>
                        <button className="cyber-button" onClick={() => setSelectedRecord(null)}>CLOSE REPORT</button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                            {/* LEFT COLUMN: VISUALS */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* MAP PLACEHOLDER (Future: Real Map) */}
                                <div className="cyber-panel" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,50,50,0.3)' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '3rem', margin: '10px' }}>🗺️</div>
                                        <div>MAP RECONSTRUCTION</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                            Bounds: {JSON.stringify(selectedRecord.bounds || 'N/A')}<br />
                                            Markers: {selectedRecord.markers?.length || 0} | Lines: {selectedRecord.leyLines?.length || 0}
                                        </div>
                                    </div>
                                </div>

                                {/* RADAR SUMMARY */}
                                <div className="cyber-panel" style={{ height: '300px' }}>
                                    <div className="cyber-title" style={{ padding: '10px' }}>HOLISTIC SIGNATURE</div>
                                    <div style={{ height: '250px' }}>
                                        <Radar data={{
                                            labels: ['Harmony', 'Tension', 'Collaboration', 'Renewal', 'Emotional'],
                                            datasets: [{
                                                label: 'This Scan',
                                                data: [
                                                    selectedRecord.stats.holistic.harmony,
                                                    selectedRecord.stats.holistic.tension,
                                                    selectedRecord.stats.holistic.collaboration,
                                                    selectedRecord.stats.holistic.renewal,
                                                    selectedRecord.stats.holistic.emotionalClimate
                                                ],
                                                backgroundColor: 'rgba(0, 240, 255, 0.4)',
                                                borderColor: 'var(--cyber-primary)',
                                                borderWidth: 2,
                                            }]
                                        }} options={{ maintainAspectRatio: false, scales: { r: { suggestedMin: 0, suggestedMax: 100, grid: { color: '#333' } } } }} />
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: DATA LISTS */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* MARKERS DETAILED LIST */}
                                <div className="cyber-panel" style={{ flex: 1, minHeight: '200px', padding: '10px' }}>
                                    <div className="cyber-title">📍 ACTIVE MARKERS ({selectedRecord.markers?.length || 0})</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                                        {selectedRecord.markers?.map((m: any, idx: number) => (
                                            <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderLeft: '2px solid var(--cyber-secondary)' }}>
                                                <div style={{ fontWeight: 'bold', color: 'var(--cyber-primary)' }}>{m.name || 'Unnamed Point'}</div>
                                                <div style={{ fontSize: '0.8rem' }}>{m.description || 'No description'}</div>
                                            </div>
                                        ))}
                                        {(!selectedRecord.markers || selectedRecord.markers.length === 0) && <div style={{ opacity: 0.5 }}>No markers recorded.</div>}
                                    </div>
                                </div>

                                {/* INTEL FEED (NEWS) */}
                                <div className="cyber-panel" style={{ flex: 1, minHeight: '200px', padding: '10px' }}>
                                    <div className="cyber-title">📡 INTEL SOURCE FEED ({selectedRecord.news?.length || 0})</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                                        {selectedRecord.news?.map((n: any, idx: number) => (
                                            <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderLeft: '2px solid var(--cyber-warning)' }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{n.title}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{n.source} - {new Date(n.publishedAt || n.date).toLocaleDateString()}</div>
                                            </div>
                                        ))}
                                        {(!selectedRecord.news || selectedRecord.news.length === 0) && <div style={{ opacity: 0.5 }}>No intel intercepted.</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TOOLBAR */}
            <div style={{
                height: '60px', borderBottom: '1px solid var(--cyber-primary)',
                display: 'flex', alignItems: 'center', padding: '0 20px',
                background: 'rgba(0,0,0,0.8)', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ fontSize: '1.5rem' }}>📊</div>
                    <div className="glitch-text" style={{ fontSize: '1.2rem', letterSpacing: '2px' }}>GLOBAL HUB</div>

                    {/* TABS */}
                    <div style={{ display: 'flex', gap: '10px', marginLeft: '30px' }}>
                        <button
                            className={`cyber-button ${activeTab === 'analytics' ? 'active' : ''}`}
                            onClick={() => setActiveTab('analytics')}
                        >
                            ANALYTICS
                        </button>
                        <button
                            className={`cyber-button ${activeTab === 'collective' ? 'active' : ''}`}
                            onClick={() => setActiveTab('collective')}
                            style={{ borderColor: 'var(--cyber-action)' }}
                        >
                            COLLECTIVE FIELD
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="cyber-button" onClick={exportData} style={{ borderColor: 'var(--cyber-secondary)' }}>
                        ⬇ CSV
                    </button>
                    <button className="cyber-button" onClick={onClose}>CLOSE</button>
                </div>
            </div>

            {/* CONTENT GRID */}
            {activeTab === 'analytics' ? (
                <div style={{
                    flex: 1, padding: '20px', overflowY: 'auto',
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'auto auto 1fr',
                    gap: '20px'
                }}>
                    {/* KPI CARDS */}
                    <div className="cyber-panel" style={{ textAlign: 'center', padding: '15px' }}>
                        <div className="data-label">TOTAL SCANS</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--cyber-primary)' }}>{totalScans}</div>
                    </div>
                    <div className="cyber-panel" style={{ textAlign: 'center', padding: '15px' }}>
                        <div className="data-label">AVG ENERGY</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--cyber-secondary)' }}>{avgEnergy.toFixed(0)}</div>
                    </div>
                    <div className="cyber-panel" style={{ textAlign: 'center', padding: '15px' }}>
                        <div className="data-label">AVG VIBRATION</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--cyber-success)' }}>{avgVibration.toFixed(0)}</div>
                    </div>
                    <div className="cyber-panel" style={{ textAlign: 'center', padding: '15px' }}>
                        <div className="data-label">ANOMALY RATE</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: anomalyRate > 20 ? 'var(--cyber-danger)' : 'var(--cyber-text)' }}>{anomalyRate.toFixed(1)}%</div>
                    </div>

                    {/* CHARTS ROW */}
                    <div className="cyber-panel" style={{ gridColumn: 'span 2', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                        <div className="cyber-title">HOLISTIC PROFILE (AVG)</div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Radar data={radarData} options={{
                                maintainAspectRatio: false,
                                scales: { r: { grid: { color: '#333' }, angleLines: { color: '#333' }, suggestedMin: 0, suggestedMax: 100 } },
                                plugins: { legend: { display: false } }
                            }} />
                        </div>
                    </div>

                    <div className="cyber-panel" style={{ gridColumn: 'span 2', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                        <div className="cyber-title">ENERGY & VIBRATION TREND</div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Line data={trendData} options={{
                                maintainAspectRatio: false,
                                scales: { y: { grid: { color: '#333' } }, x: { grid: { color: '#333' } } },
                                plugins: { legend: { position: 'bottom' } }
                            }} />
                        </div>
                    </div>

                    {/* BOTTOM ROW: TABLE */}
                    <div className="cyber-panel" style={{ gridColumn: 'span 4', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                        <div className="cyber-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>ANALYSIS HISTORY LOG</span>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{history.length} RECORDS FOUND</div>
                        </div>
                        <div style={{ flex: 1, overflow: 'auto', marginTop: '10px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                    <tr>
                                        <th style={{ padding: '10px' }}>DATE</th>
                                        <th style={{ padding: '10px' }}>ZONE</th>
                                        <th style={{ padding: '10px' }}>COUNTRY</th>
                                        <th style={{ padding: '10px' }}>VIBRATION</th>
                                        <th style={{ padding: '10px' }}>ENERGY</th>
                                        <th style={{ padding: '10px' }}>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(row => (
                                        <tr
                                            key={row.id}
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                                            onClick={() => setSelectedRecord(row)}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '8px' }}>{new Date(row.timestamp).toLocaleString()}</td>
                                            <td style={{ padding: '8px', color: 'var(--cyber-primary)' }}>{row.locationContext?.name}</td>
                                            <td style={{ padding: '8px' }}>{row.locationContext?.countryCodes.join(', ').toUpperCase()}</td>
                                            <td style={{ padding: '8px' }}>{row.stats.vibration.toFixed(0)}</td>
                                            <td style={{ padding: '8px' }}>{row.stats.energyLevel.toFixed(0)}</td>
                                            <td style={{ padding: '8px', color: row.stats.anomalyProbability > 50 ? 'var(--cyber-danger)' : 'var(--cyber-success)' }}>
                                                {row.stats.anomalyProbability > 50 ? 'CRITICAL' : 'STABLE'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                /* === COLLECTIVE FIELD VIEW === */
                <div style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '20px',
                    padding: '20px',
                    overflowY: 'auto',
                    height: '100%'
                }}>

                    {/* TOP LEFT: EMOTIONAL OCEAN */}
                    <div className="cyber-panel" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div className="cyber-title" style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>🌊 EMOTIONAL OCEAN</div>
                        <div style={{ flex: 1 }}>
                            <EmotionalOcean state={collectiveState} />
                        </div>
                    </div>

                    {/* TOP RIGHT: ENERGY FIELD (Particles) */}
                    <div className="cyber-panel" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div className="cyber-title" style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>⚡ ENERGY FIELD & COHERENCE</div>
                        <div style={{ flex: 1 }}>
                            <EnergyField state={collectiveState} />
                        </div>
                    </div>

                    {/* BOTTOM ROW: METRICS & DETAILS */}
                    <div className="cyber-panel" style={{ gridColumn: 'span 2', padding: '20px', display: 'flex', gap: '40px', alignItems: 'center' }}>
                        {/* Phase Indicator */}
                        <div style={{ textAlign: 'center' }}>
                            <div className="data-label">CURRENT PHASE</div>
                            <div className="glitch-text" style={{ fontSize: '2.5rem', color: 'var(--cyber-action)' }}>
                                {collectiveState?.phase.toUpperCase() || 'CALIBRATING...'}
                            </div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>CYCLE INDEX: {((collectiveState?.pressure_index || 0) * 100).toFixed(0)}</div>
                        </div>

                        {/* Vertical Divider */}
                        <div style={{ width: 1, height: '80%', background: 'var(--cyber-border-color)' }}></div>

                        {/* Emotion Bars */}
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
                            {Object.entries(collectiveState?.dominant_emotions || {}).map(([key, value]) => (
                                <div key={key}>
                                    <div className="data-label">{key.toUpperCase()}</div>
                                    <div style={{ height: '6px', background: '#333', borderRadius: '3px', marginTop: '5px' }}>
                                        <div style={{
                                            width: `${(value as number) * 100}%`,
                                            height: '100%',
                                            background: key === 'fear' || key === 'anger' ? 'var(--cyber-danger)' :
                                                key === 'hope' || key === 'unity' ? 'var(--cyber-success)' : 'var(--cyber-primary)',
                                            borderRadius: '3px',
                                            transition: 'width 1s ease'
                                        }}></div>
                                    </div>
                                    <div style={{ textAlign: 'right', fontSize: '0.8rem', marginTop: '2px' }}>{((value as number) * 100).toFixed(0)}%</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
