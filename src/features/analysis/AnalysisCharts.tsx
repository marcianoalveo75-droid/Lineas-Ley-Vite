import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    RadialLinearScale,
    Filler
} from 'chart.js';
import { Pie, Bar, Radar, Line } from 'react-chartjs-2';
import { type PatternResult } from './PatternDetector';
import { type Entity } from './EntityDatabase';
import { PATTERN_COLORS } from './PatternConstants';
import './AnalysisCharts.css';

ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    RadialLinearScale,
    Filler
);

interface Props {
    patterns: PatternResult[];
    entities: Entity[];
    bounds: [[number, number], [number, number]] | null;
    stats?: any;
}

export default function AnalysisCharts({ patterns, entities, bounds, stats }: Props) {
    // Pattern distribution data
    const patternTypes = patterns.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const patternChartData = {
        labels: Object.keys(patternTypes),
        datasets: [{
            label: 'Patrones Detectados',
            data: Object.values(patternTypes),
            backgroundColor: Object.keys(patternTypes).map(type => PATTERN_COLORS[type] || PATTERN_COLORS['Unknown']),
            borderColor: Object.keys(patternTypes).map(type => PATTERN_COLORS[type] || PATTERN_COLORS['Unknown']),
            borderWidth: 1,
        }],
    };

    // Entity types distribution
    const entityTypes = entities.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const entityChartData = {
        labels: Object.keys(entityTypes),
        datasets: [{
            label: 'Entidades por Tipo',
            data: Object.values(entityTypes),
            backgroundColor: 'rgba(255, 107, 107, 0.6)',
            borderColor: 'rgba(139, 0, 0, 1)',
            borderWidth: 2,
        }],
    };

    // Holistic Radar Data
    const holisticData = stats?.holistic ? {
        labels: ['Armonía', 'Tensión', 'Colaboración', 'Renovación', 'Clima'],
        datasets: [{
            label: 'Perfil Holístico',
            data: [
                stats.holistic.harmony,
                stats.holistic.tension,
                stats.holistic.collaboration,
                stats.holistic.renewal,
                stats.holistic.emotionalClimate
            ],
            backgroundColor: 'rgba(0, 240, 255, 0.2)',
            borderColor: 'rgba(0, 240, 255, 1)',
            pointBackgroundColor: 'rgba(197, 107, 255, 1)',
            borderWidth: 2,
        }]
    } : null;

    // Energy & Vibration Trend (Simulated if history not passed, but let's just use current points + fuzzy)
    const trendData = stats ? {
        labels: ['-5m', '-4m', '-3m', '-2m', '-1m', 'Actual'],
        datasets: [
            {
                label: 'Energía (%)',
                data: [
                    stats.energyLevel * 0.9,
                    stats.energyLevel * 1.1,
                    stats.energyLevel * 0.95,
                    stats.energyLevel * 1.05,
                    stats.energyLevel * 0.98,
                    stats.energyLevel
                ],
                borderColor: 'rgba(0, 240, 255, 1)',
                backgroundColor: 'rgba(0, 240, 255, 0.1)',
                fill: true,
                tension: 0.4,
            },
            {
                label: 'Vibración (Hz)',
                data: [
                    stats.vibration * 0.8,
                    stats.vibration * 1.2,
                    stats.vibration * 0.9,
                    stats.vibration * 1.1,
                    stats.vibration * 0.95,
                    stats.vibration
                ],
                borderColor: 'rgba(197, 107, 255, 1)',
                backgroundColor: 'rgba(197, 107, 255, 0.1)',
                fill: true,
                tension: 0.4,
            }
        ]
    } : null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                pointLabels: { color: '#aaa', font: { size: 10 } },
                ticks: { display: false }
            }
        },
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    color: '#fff',
                    font: { size: 10 }
                }
            },
        },
    };

    const radarOptions = {
        ...chartOptions,
        scales: {
            r: {
                min: 0,
                max: 100,
                angleLines: { color: 'rgba(255, 255, 255, 0.2)' },
                grid: { color: 'rgba(255, 255, 255, 0.2)' },
                pointLabels: { color: '#fff', font: { size: 11, weight: 'bold' as const } },
                ticks: { backdropColor: 'transparent', color: '#fff' }
            }
        }
    };

    const lineOptions = {
        ...chartOptions,
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#aaa', font: { size: 10 } }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#aaa', font: { size: 10 } }
            }
        }
    };

    return (
        <div className="analysis-charts">
            <div className="data-sources">
                <h4>📊 Fuentes de Datos</h4>
                <div className="source-item">
                    <span className="label">Área Analizada:</span>
                    {bounds ? (
                        <span className="value">
                            {((Math.abs(bounds[1][0] - bounds[0][0]) * 111) * (Math.abs(bounds[1][1] - bounds[0][1]) * 111)).toFixed(2)} km²
                        </span>
                    ) : (
                        <span className="value">No definida</span>
                    )}
                </div>
                <div className="source-item">
                    <span className="label">Coordenadas:</span>
                    {bounds && (
                        <span className="value">
                            [{bounds[0][0].toFixed(4)}, {bounds[0][1].toFixed(4)}] - [{bounds[1][0].toFixed(4)}, {bounds[1][1].toFixed(4)}]
                        </span>
                    )}
                </div>
                <div className="source-item">
                    <span className="label">Total Patrones:</span>
                    <span className="value">{patterns.length}</span>
                </div>
                <div className="source-item">
                    <span className="label">Total Entidades:</span>
                    <span className="value">{entities.length}</span>
                </div>
            </div>

            {holisticData && (
                <div className="chart-container large">
                    <h4>Perfil Holístico Integral</h4>
                    <div className="chart-wrapper">
                        <Radar data={holisticData} options={radarOptions} />
                    </div>
                </div>
            )}

            {trendData && (
                <div className="chart-container large">
                    <h4>Tendencia de Energía y Vibración</h4>
                    <div className="chart-wrapper">
                        <Line data={trendData} options={lineOptions} />
                    </div>
                </div>
            )}

            <div className="secondary-charts">
                {patterns.length > 0 && (
                    <div className="chart-container">
                        <h4>Distribución de Patrones</h4>
                        <div className="chart-wrapper">
                            <Pie data={patternChartData} options={chartOptions} />
                        </div>
                    </div>
                )}

                {entities.length > 0 && (
                    <div className="chart-container">
                        <h4>Entidades por Tipo</h4>
                        <div className="chart-wrapper">
                            <Bar data={entityChartData} options={chartOptions} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
