import { useNavigate } from 'react-router-dom';
import './UserManual.css';

export default function UserManual() {
    const navigate = useNavigate();

    return (
        <div className="manual-page">
            <div className="manual-actions-top no-print">
                <button className="cyber-button" onClick={() => navigate('/')}>← VOLVER AL INICIO</button>
            </div>

            <div className="manual-container">
                <header className="manual-header">
                    <div className="manual-badge">PROTOCOLOS DE USO</div>
                    <h1 className="manual-title">Guía de Operaciones Cuánticas</h1>
                    <p className="manual-subtitle">Manual oficial para el despliegue del sistema de análisis de Líneas Ley.</p>
                </header>

                <div className="manual-content">
                    {/* Section 1: Introduction */}
                    <section className="manual-section">
                        <h2 className="section-title">01. Introducción al Sistema</h2>
                        <p>
                            Ley Lines PWA es una plataforma de análisis geoespacial avanzada diseñada para identificar, mapear y monitorizar
                            campos de energía sutil, patrones geométricos y actividades metafísicas en el plano terrestre. El sistema correlaciona
                            datos sísmicos, astrales y de inteligencia social para entregar diagnósticos holísticos de alta precisión.
                        </p>
                    </section>

                    {/* Section 2: Core Operation */}
                    <section className="manual-section">
                        <h2 className="section-title">02. Operativa del Mapa</h2>
                        <div className="info-box">
                            <p>El mapa interactivo es tu herramienta principal. Puedes alternar entre diferentes capas (Street, Satellite, Dark, Topo) y overlays técnicos (Hydro, Railway, Geology) para contextualizar el terreno.</p>
                            <ul>
                                <li><b>Trazado:</b> Usa el modo "Draw" para conectar puntos y definir Líneas Ley.</li>
                                <li><b>Área de Análisis:</b> Define un cuadrante para que los motores de IA escaneen la zona.</li>
                                <li><b>Heatmap:</b> Activa la visualización de calor para identificar "Hotspots" de densidad energética.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 3: Intelligence & Sensors */}
                    <section className="manual-section">
                        <h2 className="section-title">03. Sensores e Inteligencia Correlativa</h2>
                        <p>A diferencia de un GPS común, este sistema utiliza flujos de datos en tiempo real:</p>
                        <div className="controls-grid">
                            <div className="control-item">
                                <span className="icon">🌍</span>
                                <div>
                                    <b>Resonancia Schumann:</b> Monitoriza la frecuencia base de la Tierra (7.83Hz). Fluctuaciones indican inestabilidad en el tejido dimensional.
                                </div>
                            </div>
                            <div className="control-item">
                                <span className="icon">🌙</span>
                                <div>
                                    <b>Contexto Astral:</b> La fase lunar y su iluminación afectan directamente los niveles de "Energía" y "Tensión" detectados.
                                </div>
                            </div>
                            <div className="control-item">
                                <span className="icon">📰</span>
                                <div>
                                    <b>Intel Feed:</b> El sistema filtra noticias globales y locales buscando eventos correlacionados con anomalías espirituales.
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Analysis Engine */}
                    <section className="manual-section">
                        <h2 className="section-title">04. El Motor de Análisis Cuántico</h2>
                        <div className="features-list">
                            <div className="feature-card">
                                <h3>Detección de Patrones</h3>
                                <p>Identifica formaciones geométricas: Triángulos (Acumuladores), Cruces (Nodos de Dispersión) y Clústeres (Puntos de Pasaje).</p>
                            </div>
                            <div className="feature-card">
                                <h3>Identificación de Entidades</h3>
                                <p>Cruce de datos con la base de registros espirituales para catalogar presencias según su alineamiento (Luz/Oscuridad).</p>
                            </div>
                            <div className="feature-card">
                                <h3>Análisis Holístico</h3>
                                <p>Métricas de Armonía, Tensión y Renovación. Un alto índice de Tensión sugiere la necesidad de "Estabilizadores de Realidad".</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 5: Analytics & Collective */}
                    <section className="manual-section">
                        <h2 className="section-title">05. Datos Globales y Colaboración</h2>
                        <p>El sistema se nutre de la red de agentes:</p>
                        <div className="metrics-explanation">
                            <div className="metric-row">
                                <span className="badge energy">ANALYTICS</span>
                                <span>Visualiza gráficos avanzados de distribución de patrones y tipos de entidades en el área de estudio.</span>
                            </div>
                            <div className="metric-row">
                                <span className="badge holistic">COLLECTIVE DB</span>
                                <span>Puedes enviar nuevos hallazgos ("Submit Entity") para expandir la base de conocimiento global de la PWA.</span>
                            </div>
                        </div>
                    </section>

                    {/* Section 6: Report Actions */}
                    <section className="manual-section">
                        <h2 className="section-title">06. Protocolos de Salida</h2>
                        <div className="action-grid">
                            <div className="action-card">
                                <h4>💾 ARCHIVE</h4>
                                <p>Guarda automáticamente tus sesiones en el historial local del dispositivo (Mission Log).</p>
                            </div>
                            <div className="action-card">
                                <h4>📄 PDF EXPORT</h4>
                                <p>Genera reportes técnicos completos con certificados de autenticidad y visualizaciones de terreno.</p>
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="manual-footer">
                    <p>Documento Nivel Lambda - Protocolo v2.5</p>
                    <p>© 2026 LEY LINES RESEARCH GROUP • ESTRICTAMENTE CONFIDENCIAL</p>
                </footer>

            </div>
        </div>
    );
}
