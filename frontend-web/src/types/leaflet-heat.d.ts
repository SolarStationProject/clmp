import * as L from 'leaflet';

declare module 'leaflet' {
    interface HeatLatLngTuple extends Array<number> {
        0: number; // lat
        1: number; // lng
        2?: number; // intensity 0–1
    }
    interface HeatMapOptions {
        minOpacity?: number;
        maxZoom?: number;
        max?: number;
        radius?: number;
        blur?: number;
        gradient?: Record<number, string>;
    }
    function heatLayer(latlngs: HeatLatLngTuple[], options?: HeatMapOptions): L.Layer;
}

declare module 'leaflet.heat' {
    export default function(): void;
}
