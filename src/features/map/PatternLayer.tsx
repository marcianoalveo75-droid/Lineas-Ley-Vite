import React from 'react';
import { CircleMarker, Popup, LayerGroup } from 'react-leaflet';
import type { PatternResult } from '../analysis/PatternDetector';
import { PATTERN_COLORS } from '../analysis/PatternConstants';

interface PatternLayerProps {
    patterns: PatternResult[];
}

const PatternLayer: React.FC<PatternLayerProps> = ({ patterns }) => {
    if (!patterns || patterns.length === 0) return null;

    return (
        <LayerGroup>
            {patterns.map((pattern, idx) => {
                const color = PATTERN_COLORS[pattern.type] || PATTERN_COLORS['Unknown'];
                const coords = pattern.coordinates[0]; // Assuming point geometry for now

                if (!coords || coords.length < 2) return null;

                // Adjust radius based on type
                let radius = 8;
                if (pattern.type === 'Nodo de Convergencia') radius = 16;
                if (pattern.type === 'Triángulo de Poder') radius = 14;

                return (
                    <CircleMarker
                        key={`${pattern.type}-${idx}`}
                        center={[coords[0], coords[1]]} // Already standardized to [lat, lng]
                        pathOptions={{
                            color: '#fff',
                            weight: 2,
                            fillColor: color,
                            fillOpacity: 0.9,
                            className: 'pattern-marker-glow'
                        }}
                        radius={radius}
                    >
                        <Popup>
                            <div className="cyber-popup" style={{ borderColor: color }}>
                                <h4 style={{ color: color, margin: '0 0 5px 0', textShadow: `0 0 10px ${color}44` }}>{pattern.type}</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>{pattern.description}</p>
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}
        </LayerGroup>
    );
};

export default PatternLayer;
