import { db } from '../../config/database';
import { Reporte, DetalleReporteResponse, ValidacionReporte, EstadoReporte, RolUsuario } from '../../shared/types';

const ESTADOS_VALIDOS: EstadoReporte[] = ['Pendiente', 'En Proceso', 'Resuelto', 'Rechazado'];

export async function findByOwnReportesId(ciudadanoId: string): Promise<Reporte[]> {
    const result = await db.query<Reporte>(
        `SELECT
            r.id, r.ciudadano_id, r.codigo, r.titulo, r.descripcion, r.categoria, r.foto,
            r.fecha_creacion::text AS fecha_creacion, r.estado, r.direccion, r.comuna,
            ST_Y(r.geom) AS latitud,
            ST_X(r.geom) AS longitud,
            u.nombre, u.rol
         FROM reportes r
         INNER JOIN usuarios u ON r.ciudadano_id = u.id
         WHERE r.ciudadano_id = $1
         ORDER BY r.fecha_creacion DESC`,
        [ciudadanoId]
    );
    return result.rows;
}

export async function findDetailsByReporteId(reporteId: string): Promise<DetalleReporteResponse | null> {
    const result = await db.query(
        `SELECT
            r.id, r.ciudadano_id, r.codigo, r.titulo, r.descripcion, r.categoria, r.foto,
            r.fecha_creacion::text AS fecha_creacion, r.estado, r.direccion, r.comuna,
            ST_Y(r.geom) AS latitud,
            ST_X(r.geom) AS longitud,
            COALESCE((
                SELECT json_agg(json_build_object(
                    'id',              v.id,
                    'reporte_id',      v.reporte_id,
                    'usuario_id',      v.usuario_id,
                    'usuario_nombre',  u2.nombre,
                    'fecha',           v.fecha::text,
                    'estado_asignado', v.estado_asignado,
                    'comentario',      v.comentario
                ) ORDER BY v.fecha DESC)
                FROM validacion_reportes v
                LEFT JOIN usuarios u2 ON v.usuario_id = u2.id
                WHERE v.reporte_id = r.id
            ), '[]'::json) AS historial_cambios,
            COALESCE((
                SELECT json_agg(json_build_object(
                    'id',              c.id,
                    'reporte_id',      c.reporte_id,
                    'admin_id',        c.admin_id,
                    'admin_nombre',    adm.nombre,
                    'comentario',      c.comentario,
                    'fecha_creacion',  c.fecha_creacion::text
                ) ORDER BY c.fecha_creacion DESC)
                FROM comentarios_internos c
                LEFT JOIN usuarios adm ON c.admin_id = adm.id
                WHERE c.reporte_id = r.id
            ), '[]'::json) AS comentarios_internos
         FROM reportes r
         WHERE r.id = $1`,
        [reporteId]
    );
    return result.rows[0] ?? null;
}

export async function addChangeHistorialReportesId(
    reporteId: string,
    usuarioId: string,
    estadoAsignado: EstadoReporte,
    comentario: string
): Promise<Partial<ValidacionReporte>> {
    const result = await db.query(
        `INSERT INTO validacion_reportes (reporte_id, usuario_id, fecha, estado_asignado, comentario)
         VALUES ($1, $2, NOW(), $3, $4)
         RETURNING id, fecha::text`,
        [reporteId, usuarioId, estadoAsignado, comentario]
    );
    return result.rows[0];
}

// Obtiene info del reporte + ciudadano para enviar email de notificación (HU006)
export async function getReporteConCiudadano(reporteId: string): Promise<{
    codigo: string; titulo: string; estado: EstadoReporte;
    ciudadano_email: string; ciudadano_nombre: string;
} | null> {
    const result = await db.query(
        `SELECT r.codigo, r.titulo, r.estado,
                u.email AS ciudadano_email, u.nombre AS ciudadano_nombre
         FROM reportes r
         INNER JOIN usuarios u ON r.ciudadano_id = u.id
         WHERE r.id = $1`,
        [reporteId]
    );
    return result.rows[0] ?? null;
}

export async function updatedEstadoReportesId(reporteId: string, nuevoEstado: EstadoReporte): Promise<string> {
    if (!ESTADOS_VALIDOS.includes(nuevoEstado)) {
        throw Object.assign(new Error(`Estado inválido: ${nuevoEstado}`), { status: 400 });
    }
    const result = await db.query(
        'UPDATE reportes SET estado = $1 WHERE id = $2 RETURNING estado',
        [nuevoEstado, reporteId]
    );
    if (result.rowCount === 0) throw Object.assign(new Error('Reporte no encontrado.'), { status: 404 });
    return result.rows[0].estado;
}

export async function obtenerTodos(_usuarioId: string, _usuarioRol: RolUsuario): Promise<Reporte[]> {
    // Todos los usuarios autenticados ven todos los reportes en el mapa (HU005) y detalle (HU021)
    const result = await db.query<Reporte>(
        `SELECT
            id, ciudadano_id, codigo, titulo, descripcion, categoria, foto,
            fecha_creacion::text AS fecha_creacion, estado, direccion, comuna,
            ST_Y(geom) AS latitud,
            ST_X(geom) AS longitud
         FROM reportes
         ORDER BY fecha_creacion DESC`
    );
    return result.rows;
}

// HU004: Crear reporte con foto y GPS
export async function insertReport(data: {
    ciudadano_id: string;
    titulo:       string;
    descripcion:  string;
    categoria:    string;
    foto?:        string;
    direccion:    string;
    comuna:       string;
    latitud:      number;
    longitud:     number;
}): Promise<Reporte> {
    const codigo = `CLM-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const result = await db.query<Reporte>(
        `INSERT INTO reportes
            (ciudadano_id, codigo, titulo, descripcion, categoria, foto, estado, direccion, comuna, geom)
         VALUES
            ($1, $2, $3, $4, $5, $6, 'Pendiente', $7, $8, ST_SetSRID(ST_MakePoint($10, $9), 4326))
         RETURNING
            id, ciudadano_id, codigo, titulo, descripcion, categoria, foto,
            fecha_creacion::text AS fecha_creacion, estado, direccion, comuna,
            ST_Y(geom) AS latitud, ST_X(geom) AS longitud`,
        [
            data.ciudadano_id, codigo, data.titulo, data.descripcion,
            data.categoria, data.foto ?? null, data.direccion, data.comuna,
            data.latitud, data.longitud,
        ]
    );
    return result.rows[0];
}
