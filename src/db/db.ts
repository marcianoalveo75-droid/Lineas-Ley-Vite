import Dexie, { type EntityTable } from 'dexie';
import { type LeyLine, type MarkerData } from '../features/map/mapSlice';

const db = new Dexie('LeyLinesDB') as Dexie & {
    leyLines: EntityTable<LeyLine, 'id'>;
    activeMarkers: EntityTable<MarkerData, 'id'>;
};

db.version(1).stores({
    leyLines: 'id, name',
    activeMarkers: 'id, name'
});

export { db };
