
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchCollectiveField, type CollectiveAnalysisResponse } from './AnalysisAPI';
import './AnalysisSidebar.css';

// Archetype Colors
const ARCHETYPE_COLORS: Record<string, string> = {
    miedo: '#4a148c', // Dark Purple
    ira: '#d50000', // Red
    esperanza: '#00c853', // Green
    confusion: '#6200ea', // Deep Purple/Blue
    sacrificio: '#3e2723', // Brown
    renacimiento: '#00bfa5', // Teal
    control: '#263238', // Dark Blue Grey
    liberacion: '#ffab00'  // Amber
};

const TERMS_TRANSLATION: Record<string, string> = {
    miedo: 'Miedo',
    ira: 'Ira',
    esperanza: 'Esperanza',
    confusion: 'Confusión',
    sacrificio: 'Sacrificio',
    renacimiento: 'Renacimiento',
    control: 'Control',
    liberacion: 'Liberación'
};

export default function CollectiveSentiment() {
    const [data, setData] = useState<CollectiveAnalysisResponse['data'] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const result = await fetchCollectiveField();
        if (result && result.status === 'success') {
            setData(result.data);
        } else {
            setError(true);
        }
        setLoading(false);
    };

    if (loading) return <div className="p-4 text-center">Sintonizando el campo colectivo...</div>;
    if (error || !data) return null;

    const dominantColor = ARCHETYPE_COLORS[data.dominant] || '#888';

    return (
        <div className="collective-container" style={{ padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
                👁️ Campo Colectivo Global
            </h4>

            {/* Main Pulse Visualization */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', position: 'relative' }}>
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 0.3, 0.7],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{
                        position: 'absolute',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: dominantColor,
                        filter: 'blur(20px)',
                    }}
                />
                <div style={{ zIndex: 2, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Dominancia</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white', textTransform: 'capitalize' }}>
                        {TERMS_TRANSLATION[data.dominant] || data.dominant}
                    </div>
                </div>
            </div>

            {/* Density Meter */}
            <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span>Densidad Emocional</span>
                    <span>{data.density_index}%</span>
                </div>
                <div style={{ height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(data.density_index * 2, 100)}%` }} // Mult by 2 to make it visually fill up faster
                        style={{ height: '100%', background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)' }}
                    />
                </div>
            </div>

            {/* Archetype Bars */}
            <div className="archetype-list">
                {Object.entries(data.scores)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 4) // Show top 4
                    .map(([arch, score]) => (
                        <div key={arch} style={{ marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                <span style={{ textTransform: 'capitalize' }}>{TERMS_TRANSLATION[arch] || arch}</span>
                                <span>{score}%</span>
                            </div>
                            <div style={{ height: '4px', background: '#222', borderRadius: '2px', marginTop: '2px' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score * 5}%` }} // Scale up for visibility
                                    style={{ height: '100%', background: ARCHETYPE_COLORS[arch] || '#888', borderRadius: '2px' }}
                                />
                            </div>
                        </div>
                    ))}
            </div>

            <div style={{ marginTop: '10px', fontSize: '0.7rem', color: '#666', textAlign: 'center', cursor: 'pointer' }} onClick={loadData}>
                🔄 Actualizar Pulso
            </div>
        </div>
    );
}
