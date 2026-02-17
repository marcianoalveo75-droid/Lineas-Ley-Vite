declare module '@mapbox/leaflet-omnivore';

declare module '@mapbox/togeojson' {
	export function kml(doc: Document): any;
}

// Basic declaration for tokml (no official types available)
declare module 'tokml' {
	function tokml(geojson: any, options?: any): string;
	export default tokml;
}

// Allow importing plain CSS files
declare module '*.css';
