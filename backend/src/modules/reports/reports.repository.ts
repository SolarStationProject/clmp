import { db } from '../../config/database';
import { Reporte, DetalleReporteResponse, ValidacionReporte, EstadoReporte, RolUsuario } from '../../shared/types';

const ESTADOS_VALIDOS: EstadoReporte[] = ['Pendiente', 'En Proceso', 'Resuelto', 'Rechazado'];

export async function findByOwnReportesId(ciudadanoId: string, incluirEliminados = false): Promise<Reporte[]> {
    const result = await db.query<Reporte>(
        `SELECT
            r.id, r.ciudadano_id, r.codigo, r.titulo, r.descripcion, r.categoria, r.foto,
            r.fecha_creacion::text AS fecha_creacion, r.estado, r.direccion, r.comuna,
            COALESCE(r.eliminado, false) AS eliminado,
            ST_Y(r.geom) AS latitud,
            ST_X(r.geom) AS longitud,
            u.nombre, u.rol
         FROM reportes r
         INNER JOIN usuarios u ON r.ciudadano_id = u.id
         WHERE r.ciudadano_id = $1
           AND ($2 OR COALESCE(r.eliminado, false) = false)
         ORDER BY r.fecha_creacion DESC`,
        [ciudadanoId, incluirEliminados]
    );
    return result.rows;
}

export async function editarReporte(
    reporteId: string,
    ciudadanoId: string,
    datos: { titulo?: string; descripcion?: string; categoria?: string; foto?: string }
): Promise<Reporte | null> {
    const result = await db.query<Reporte>(
        `UPDATE reportes
         SET titulo      = COALESCE($3, titulo),
             descripcion = COALESCE($4, descripcion),
             categoria   = COALESCE($5, categoria),
             foto        = COALESCE($6, foto)
         WHERE id = $1
           AND ciudadano_id = $2
           AND estado = 'Pendiente'
           AND COALESCE(eliminado, false) = false
         RETURNING
            id, ciudadano_id, codigo, titulo, descripcion, categoria, foto,
            fecha_creacion::text AS fecha_creacion, estado, direccion, comuna,
            ST_Y(geom) AS latitud, ST_X(geom) AS longitud`,
        [reporteId, ciudadanoId, datos.titulo ?? null, datos.descripcion ?? null, datos.categoria ?? null, datos.foto ?? null]
    );
    return result.rows[0] ?? null;
}

export async function eliminarReporte(reporteId: string, ciudadanoId: string): Promise<boolean> {
    const result = await db.query(
        `UPDATE reportes
         SET eliminado = true
         WHERE id = $1
           AND ciudadano_id = $2
           AND estado = 'Pendiente'
           AND COALESCE(eliminado, false) = false`,
        [reporteId, ciudadanoId]
    );
    return (result.rowCount ?? 0) > 0;
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

export async function insertComentarioInterno(
    reporteId: string,
    adminId: string,
    comentario: string
): Promise<void> {
    await db.query(
        `INSERT INTO comentarios_internos (reporte_id, admin_id, comentario)
         VALUES ($1, $2, $3)`,
        [reporteId, adminId, comentario]
    );
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

// HU014: Reportes filtrados por estado, categoría, comuna, fechas, prioridad (solo Admin)
export async function obtenerFiltrados(filtros: {
    estado?: string; categoria?: string; comuna?: string;
    fechaDesde?: string; fechaHasta?: string; prioridad?: string;
}): Promise<Reporte[]> {
    const conds: string[] = ['COALESCE(r.eliminado, false) = false'];
    const params: unknown[] = [];
    let i = 1;
    if (filtros.estado)     { conds.push(`r.estado = $${i++}`);              params.push(filtros.estado); }
    if (filtros.categoria)  { conds.push(`r.categoria = $${i++}`);           params.push(filtros.categoria); }
    if (filtros.comuna)     { conds.push(`r.comuna ILIKE $${i++}`);          params.push(`%${filtros.comuna}%`); }
    if (filtros.fechaDesde) { conds.push(`r.fecha_creacion >= $${i++}`);     params.push(filtros.fechaDesde); }
    if (filtros.fechaHasta) { conds.push(`r.fecha_creacion <= $${i++}::date + 1`); params.push(filtros.fechaHasta); }
    if (filtros.prioridad)  { conds.push(`COALESCE(r.prioridad,'Normal') = $${i++}`); params.push(filtros.prioridad); }
    const result = await db.query<Reporte>(
        `SELECT r.id, r.ciudadano_id, r.codigo, r.titulo, r.descripcion, r.categoria, r.foto,
                r.fecha_creacion::text AS fecha_creacion, r.estado, r.direccion, r.comuna,
                COALESCE(r.prioridad, 'Normal') AS prioridad,
                ST_Y(r.geom) AS latitud, ST_X(r.geom) AS longitud, u.nombre
         FROM reportes r INNER JOIN usuarios u ON r.ciudadano_id = u.id
         WHERE ${conds.join(' AND ')}
         ORDER BY r.fecha_creacion DESC`,
        params
    );
    return result.rows;
}

// HU015: Asignar prioridad a un reporte (solo Admin)
export async function asignarPrioridad(reporteId: string, prioridad: string): Promise<boolean> {
    const result = await db.query(
        `UPDATE reportes SET prioridad = $1 WHERE id = $2`,
        [prioridad, reporteId]
    );
    return (result.rowCount ?? 0) > 0;
}

// HU017: KPIs agregados del sistema
export async function getKPIs(): Promise<{
    total: number; pendientes: number; en_proceso: number; resueltos: number; rechazados: number;
    pct_resuelto: number;
    por_categoria: Array<{ categoria: string; total: number }>;
    por_comuna:    Array<{ comuna: string;    total: number }>;
}> {
    const [resumen, porCat, porCom] = await Promise.all([
        db.query(`
            SELECT COUNT(*)::int AS total,
                   COUNT(*) FILTER (WHERE estado='Pendiente')::int  AS pendientes,
                   COUNT(*) FILTER (WHERE estado='En Proceso')::int AS en_proceso,
                   COUNT(*) FILTER (WHERE estado='Resuelto')::int   AS resueltos,
                   COUNT(*) FILTER (WHERE estado='Rechazado')::int  AS rechazados,
                   ROUND(COUNT(*) FILTER (WHERE estado='Resuelto')*100.0/NULLIF(COUNT(*),0),1) AS pct_resuelto
            FROM reportes WHERE COALESCE(eliminado,false)=false`),
        db.query(`
            SELECT categoria, COUNT(*)::int AS total FROM reportes
            WHERE COALESCE(eliminado,false)=false
            GROUP BY categoria ORDER BY total DESC LIMIT 6`),
        db.query(`
            SELECT comuna, COUNT(*)::int AS total FROM reportes
            WHERE COALESCE(eliminado,false)=false
            GROUP BY comuna ORDER BY total DESC LIMIT 5`),
    ]);
    return { ...resumen.rows[0], por_categoria: porCat.rows, por_comuna: porCom.rows };
}

// HU012: Verificar si coordenadas están dentro de Providencia (bounding box PostGIS)
export async function verificarDentroProvidencia(lat: number, lng: number): Promise<boolean> {
    const result = await db.query<{ dentro: boolean }>(
        `SELECT ST_Contains(
            ST_MakeEnvelope(-70.638, -33.452, -70.589, -33.407, 4326),
            ST_SetSRID(ST_MakePoint($2, $1), 4326)
        ) AS dentro`,
        [lat, lng]
    );
    return result.rows[0]?.dentro ?? false;
}

// HU022: Detectar reportes existentes a menos de 50 metros
export async function checkDuplicados(lat: number, lng: number): Promise<Array<{
    id: string; codigo: string; titulo: string; categoria: string; estado: string; distancia_metros: number;
}>> {
    const result = await db.query(
        `SELECT r.id, r.codigo, r.titulo, r.categoria, r.estado,
                ROUND(ST_Distance(
                    r.geom::geography,
                    ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
                )::numeric, 1) AS distancia_metros
         FROM reportes r
         WHERE ST_DWithin(
                   r.geom::geography,
                   ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
                   50
               )
           AND COALESCE(r.eliminado, false) = false
         ORDER BY distancia_metros
         LIMIT 5`,
        [lat, lng]
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
