// HU018: Servicio de mapa de calor — usa columna geom (PostGIS) del esquema unificado
import { db } from '../../config/database';

export interface HeatMapPoint {
    lat:       number;
    lng:       number;
    count:     number;
    intensity: number;
}

export interface ZonaCritica {
    nombre:     string;
    lat:        number;
    lng:        number;
    total:      number;
    pendientes: number;
    criticidad: 'alta' | 'media' | 'baja';
}

export interface FiltrosHeatMap {
    estado?:      string;
    fecha_desde?: string;
    fecha_hasta?: string;
}

const GRID       = 0.015; // ~1.5 km
const GRID_GRANDE = 0.03; // ~3 km

export const obtenerPuntosCalor = async (filtros: FiltrosHeatMap): Promise<HeatMapPoint[]> => {
    const condiciones: string[] = [];
    const params: (string | number)[] = [];

    if (filtros.estado) {
        params.push(filtros.estado);
        condiciones.push(`estado = $${params.length}`);
    }
    if (filtros.fecha_desde) {
        params.push(filtros.fecha_desde);
        condiciones.push(`fecha_creacion >= $${params.length}`);
    }
    if (filtros.fecha_hasta) {
        params.push(filtros.fecha_hasta);
        condiciones.push(`fecha_creacion <= $${params.length}`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    const resultado = await db.query(
        `SELECT ST_Y(geom) AS lat, ST_X(geom) AS lng
         FROM reportes ${where}
         ORDER BY fecha_creacion DESC LIMIT 2000`,
        params
    );

    const celdas: Record<string, { lat: number; lng: number; n: number }> = {};
    for (const row of resultado.rows) {
        const lat = parseFloat(row.lat);
        const lng = parseFloat(row.lng);
        if (isNaN(lat) || isNaN(lng)) continue;
        const cLat = (Math.round(lat / GRID) * GRID).toFixed(4);
        const cLng = (Math.round(lng / GRID) * GRID).toFixed(4);
        const key  = `${cLat},${cLng}`;
        if (!celdas[key]) celdas[key] = { lat, lng, n: 0 };
        celdas[key].n++;
    }

    const puntos = Object.values(celdas);
    if (!puntos.length) return [];
    const maxN = Math.max(...puntos.map(p => p.n));

    return puntos.map(p => ({
        lat:       parseFloat(p.lat.toFixed(6)),
        lng:       parseFloat(p.lng.toFixed(6)),
        count:     p.n,
        intensity: maxN > 0 ? p.n / maxN : 0,
    }));
};

export const obtenerZonasCriticas = async (): Promise<ZonaCritica[]> => {
    const resultado = await db.query(
        `SELECT ST_Y(geom) AS lat, ST_X(geom) AS lng, estado
         FROM reportes WHERE estado IN ('Pendiente', 'En Proceso')
         ORDER BY fecha_creacion DESC LIMIT 1000`
    );

    const zonas: Record<string, { lats: number[]; lngs: number[]; total: number; pendientes: number }> = {};
    for (const row of resultado.rows) {
        const lat = parseFloat(row.lat);
        const lng = parseFloat(row.lng);
        if (isNaN(lat) || isNaN(lng)) continue;
        const cLat = (Math.round(lat / GRID_GRANDE) * GRID_GRANDE).toFixed(3);
        const cLng = (Math.round(lng / GRID_GRANDE) * GRID_GRANDE).toFixed(3);
        const key  = `${cLat},${cLng}`;
        if (!zonas[key]) zonas[key] = { lats: [], lngs: [], total: 0, pendientes: 0 };
        zonas[key].lats.push(lat);
        zonas[key].lngs.push(lng);
        zonas[key].total++;
        if (row.estado === 'Pendiente') zonas[key].pendientes++;
    }

    return Object.values(zonas)
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)
        .map(z => {
            const lat = z.lats.reduce((a, b) => a + b, 0) / z.lats.length;
            const lng = z.lngs.reduce((a, b) => a + b, 0) / z.lngs.length;
            const criticidad: ZonaCritica['criticidad'] =
                z.pendientes >= 5 ? 'alta' : z.pendientes >= 2 ? 'media' : 'baja';
            return {
                nombre:     `Zona (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
                lat:        parseFloat(lat.toFixed(6)),
                lng:        parseFloat(lng.toFixed(6)),
                total:      z.total,
                pendientes: z.pendientes,
                criticidad,
            };
        });
};

export const obtenerDatosExportacion = async (filtros: FiltrosHeatMap) => {
    const condiciones: string[] = [];
    const params: (string | number)[] = [];

    if (filtros.estado) { params.push(filtros.estado); condiciones.push(`estado = $${params.length}`); }
    if (filtros.fecha_desde) { params.push(filtros.fecha_desde); condiciones.push(`fecha_creacion >= $${params.length}`); }
    if (filtros.fecha_hasta) { params.push(filtros.fecha_hasta); condiciones.push(`fecha_creacion <= $${params.length}`); }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const resultado = await db.query(
        `SELECT id, ST_Y(geom) AS latitud, ST_X(geom) AS longitud, estado, comuna,
                TO_CHAR(fecha_creacion, 'YYYY-MM-DD HH24:MI') AS fecha_creacion
         FROM reportes ${where}
         ORDER BY fecha_creacion DESC LIMIT 5000`,
        params
    );
    return resultado.rows;
};
