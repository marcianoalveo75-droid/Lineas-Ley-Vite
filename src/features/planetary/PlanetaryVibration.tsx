import { useEffect, useRef, useState } from 'react';
import '../../theme/CyberTheme.css';

interface Earthquake {
    mag: number;
    place: string;
    time: number;
    url: string;
}

export default function PlanetaryVibration({ onClose }: { onClose: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
    const [intensity, setIntensity] = useState(0); // 0 to 1
    const [loading, setLoading] = useState(true);

    // --- EARTHQUAKE DATA FETCHING ---
    useEffect(() => {
        const fetchQuakes = async () => {
            try {
                // Fetch last 10 significant earthquakes (>4.0) to ensure we have data
                const res = await fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=10&minmagnitude=4.0&orderby=time');
                const data = await res.json();

                const quakes: Earthquake[] = data.features.map((f: any) => ({
                    mag: f.properties.mag,
                    place: f.properties.place,
                    time: f.properties.time,
                    url: f.properties.url
                }));

                setEarthquakes(quakes);

                // Calculate global "tension" based on the max magnitude in the batch
                // If max mag is 4.5 -> intensity 0.1
                // If max mag is 8.0 -> intensity 1.0
                if (quakes.length > 0) {
                    const maxMag = Math.max(...quakes.map(q => q.mag));
                    const newIntensity = Math.min(Math.max((maxMag - 4.5) / 3.5, 0), 1);
                    setIntensity(newIntensity);
                }

                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch earthquakes", err);
                setLoading(false);
            }
        };

        fetchQuakes();
        const interval = setInterval(fetchQuakes, 60000 * 5); // Update every 5 mins
        return () => clearInterval(interval);
    }, []);

    // --- CANVAS VISUALIZATION ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let offset = 0;

        const render = () => {
            // Resize logic
            if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
            }

            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Transparent background

            // Dynamic Params based on Intensity
            const baseFreq = 7.83; // Schumann Resonance
            const freq = 0.015; // Visual frequency for canvas

            // Color shifts from Cyan (Calm) to Red (Alert)
            // Calm: 0, 255, 204 (#00ffcc)
            // Alert: 255, 68, 68 (#ff4444)
            const r = Math.floor(0 + (255 - 0) * intensity);
            const g = Math.floor(255 + (68 - 255) * intensity);
            const b = Math.floor(204 + (68 - 204) * intensity);
            const color = `rgb(${r}, ${g}, ${b})`;

            // Amplitude increases with intensity
            const amplitude = 30 + (intensity * 50);

            // Speed increases slightly with intensity
            const speed = (baseFreq / 60) + (intensity * 0.2);

            // Draw Wave
            ctx.beginPath();
            ctx.lineWidth = 2 + (intensity * 3);
            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10 + (intensity * 20);

            for (let x = 0; x < canvas.width; x++) {
                // Add some "jitter/noise" if intensity is high
                const noise = intensity > 0.5 ? (Math.random() - 0.5) * (intensity * 5) : 0;

                const y = canvas.height / 2 +
                    Math.sin(x * freq + offset) * amplitude + noise;

                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Heartbeat Pulse Circle (Schumann Visualization)
            const pulseSize = 5 + Math.sin(offset * 2) * 2;
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, pulseSize, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            offset += speed;
            animationId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationId);
    }, [intensity]);

    return (
        <div className="cyber-panel planetary-panel" style={{
            position: 'absolute', top: 70, left: 20, right: 20, bottom: 20, zIndex: 3000,
            display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(5, 10, 20, 0.98)',
            border: '1px solid var(--cyber-primary)'
        }}>
            {/* Header */}
            <div className="cyber-panel-header" style={{ padding: '15px 20px', borderBottom: '1px solid var(--cyber-border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.5rem' }}>🌍</span>
                    <div>
                        <span className="cyber-title" style={{ fontSize: '1.2rem' }}>PLANETARY RESONANCE</span>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>EARTH VIBRATION ANALYSIS</div>
                    </div>
                </div>
                <button className="cyber-button-icon" onClick={onClose} style={{ fontSize: '1.5rem' }}>×</button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>

                {/* --- VISUALIZATION SECTION --- */}
                <div style={{ flex: 2, position: 'relative', display: 'flex', flexDirection: 'column', padding: 20 }}>
                    <div style={{ position: 'absolute', top: 30, left: 30, zIndex: 10 }}>
                        <div className="data-label" style={{ fontSize: '2rem', color: 'var(--cyber-primary)', textShadow: '0 0 10px var(--cyber-primary)' }}>
                            7.83 Hz
                        </div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>SCHUMANN RESONANCE (BASE)</div>
                    </div>

                    <div style={{ position: 'absolute', top: 30, right: 30, textAlign: 'right', zIndex: 10 }}>
                        <div className="data-label" style={{ fontSize: '1.5rem', color: intensity > 0.5 ? '#ff4444' : '#00ffcc' }}>
                            {intensity > 0.6 ? 'HIGH ALERT' : intensity > 0.3 ? 'MODERATE' : 'STABLE'}
                        </div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>SEISMIC TENSION INDEX</div>
                    </div>

                    <div style={{ flex: 1, border: '1px solid #222', borderRadius: 10, background: 'radial-gradient(circle, #0a1525 0%, #000 90%)', position: 'relative' }}>
                        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
                    </div>
                </div>

                {/* --- DATA SIDEBAR --- */}
                <div className="planetary-sidebar" style={{
                    flex: 1, borderLeft: '1px solid #333', padding: 20,
                    backgroundColor: 'rgba(0,0,0,0.3)', overflowY: 'auto',
                    minWidth: 300
                }}>
                    <div className="data-label" style={{ marginBottom: 15 }}>RECENT SEISMIC ACTIVITY</div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 20 }}>INITIALIZING SENSORS...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {earthquakes.map((quake, i) => (
                                <div key={i} className="sci-fi-list-item" style={{
                                    padding: 15, border: '1px solid #222',
                                    borderLeft: `3px solid ${quake.mag > 6 ? '#ff0000' : quake.mag > 5 ? '#ffaa00' : '#00ffcc'}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: quake.mag > 6 ? '#ff4444' : 'white' }}>
                                            M {quake.mag.toFixed(1)}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                                            {new Date(quake.time).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#ccc' }}>{quake.place}</div>
                                    <a href={quake.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--cyber-primary)', marginTop: 5, display: 'block' }}>
                                        VIEW REPORT &gt;
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .planetary-panel {
                        flex-direction: column !important;
                    }
                    .planetary-sidebar {
                        border-left: none !important;
                        border-top: 1px solid #333;
                        height: 40%;
                    }
                }
            `}</style>
        </div>
    );
}
