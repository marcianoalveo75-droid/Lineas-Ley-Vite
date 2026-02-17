import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setLeyLines, setActiveMarkers } from './mapSlice';
import { db } from '../../db/db';

export function useMapPersistence() {
    const dispatch = useAppDispatch();
    const { leyLines, activeMarkers } = useAppSelector((state) => state.map);

    // Load from DB on mount
    useEffect(() => {
        const loadData = async () => {
            const lines = await db.leyLines.toArray();
            const markers = await db.activeMarkers.toArray();

            if (lines.length > 0) {
                dispatch(setLeyLines(lines));
            }

            if (markers.length > 0) {
                // Batch update to prevent "removeChild" errors in Leaflet
                dispatch(setActiveMarkers(markers));
            }
        };
        loadData();
    }, [dispatch]);

    // Save to DB on change
    useEffect(() => {
        const saveLines = async () => {
            await db.leyLines.clear();
            await db.leyLines.bulkPut(leyLines);
        };
        saveLines();
    }, [leyLines]);

    useEffect(() => {
        const saveMarkers = async () => {
            await db.activeMarkers.clear();
            await db.activeMarkers.bulkPut(activeMarkers);
        };
        saveMarkers();
    }, [activeMarkers]);
}
