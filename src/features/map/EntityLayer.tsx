import React from 'react';
import { CircleMarker, Popup, LayerGroup } from 'react-leaflet';
import type { Entity } from '../analysis/EntityDatabase';

interface EntityLayerProps {
    entities: Entity[];
}

const EntityLayer: React.FC<EntityLayerProps> = ({ entities }) => {
    if (!entities || entities.length === 0) return null;

    return (
        <LayerGroup>
            {entities.map((entity, idx) => {
                if (!entity.coordinates) return null;

                const isDark = entity.alignment === 'dark';
                const color = isDark ? '#ff0055' : '#00f2ff';

                return (
                    <CircleMarker
                        key={`${entity.id}-${idx}`}
                        center={[entity.coordinates[0], entity.coordinates[1]]}
                        pathOptions={{
                            color: '#fff',
                            weight: 1,
                            fillColor: color,
                            fillOpacity: 0.7,
                            className: 'cyber-entity-marker'
                        }}
                        radius={8}
                    >
                        <Popup>
                            <div className="cyber-popup" style={{ minWidth: '200px' }}>
                                <h3 style={{
                                    color: color,
                                    margin: '0 0 8px 0',
                                    textTransform: 'uppercase',
                                    borderBottom: `1px solid ${color}`,
                                    paddingBottom: '4px'
                                }}>
                                    {entity.name}
                                </h3>
                                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '8px' }}>
                                    <strong>CLASE:</strong> {entity.type} <br />
                                    <strong>INFLUENCIA:</strong> {entity.influence}
                                </div>
                                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>
                                    {entity.description}
                                </p>
                                {entity.biblicalReference && (
                                    <div style={{
                                        marginTop: '10px',
                                        fontSize: '0.75rem',
                                        fontStyle: 'italic',
                                        color: '#aaa'
                                    }}>
                                        Referencia: {entity.biblicalReference}
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}
        </LayerGroup>
    );
};

export default EntityLayer;
