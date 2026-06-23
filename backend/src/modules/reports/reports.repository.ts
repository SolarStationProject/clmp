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
            COALESCE(r.verificado_admin, false) AS verificado_admin,
            (SELECT COUNT(*)::int FROM confirmaciones_reporte cr WHERE cr.reporte_id = r.id) AS confirmaciones,
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

// HU008: Verificar autenticidad de reporte (admin)
export async function verificarReporte(reporteId: string): Promise<boolean> {
    const result = await db.query(
        `UPDATE reportes SET verificado_admin = true WHERE id = $1`,
        [reporteId]
    );
    return (result.rowCount ?? 0) > 0;
}

// HU013: Confirmar reporte (ciudadano — un voto por reporte)
export async function confirmarReporte(reporteId: string, ciudadanoId: string): Promise<{ ok: boolean; yaConfirmado: boolean }> {
    try {
        await db.query(
            `INSERT INTO confirmaciones_reporte (reporte_id, ciudadano_id) VALUES ($1, $2)`,
            [reporteId, ciudadanoId]
        );
        return { ok: true, yaConfirmado: false };
    } catch (err: any) {
        if (err.code === '23505') return { ok: false, yaConfirmado: true }; // PK duplicada
        throw err;
    }
}

// HU013: Contar confirmaciones y verificar si el ciudadano ya confirmó
export async function getConfirmaciones(reporteId: string, ciudadanoId?: string): Promise<{
    total: number; yaConfirmado: boolean;
}> {
    const [cnt, mine] = await Promise.all([
        db.query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM confirmaciones_reporte WHERE reporte_id = $1`, [reporteId]),
        ciudadanoId
            ? db.query<{ existe: boolean }>(`SELECT EXISTS(SELECT 1 FROM confirmaciones_reporte WHERE reporte_id=$1 AND ciudadano_id=$2) AS existe`, [reporteId, ciudadanoId])
            : Promise.resolve({ rows: [{ existe: false }] }),
    ]);
    return { total: cnt.rows[0].total, yaConfirmado: mine.rows[0].existe };
}

// HU008: Lista de reportes para verificación admin (con count confirmaciones)
export async function getReportesParaVerificar(): Promise<Array<{
    id: string; codigo: string; titulo: string; categoria: string; estado: string;
    prioridad: string; foto?: string; verificado_admin: boolean; fecha_creacion: string;
    nombre: string; confirmaciones: number;
}>> {
    const result = await db.query(`
        SELECT r.id, r.codigo, r.titulo, r.categoria, r.estado,
               COALESCE(r.prioridad, 'Normal')        AS prioridad,
               r.foto,
               COALESCE(r.verificado_admin, false)    AS verificado_admin,
               r.fecha_creacion::text                 AS fecha_creacion,
               u.nombre,
               (SELECT COUNT(*)::int FROM confirmaciones_reporte c WHERE c.reporte_id = r.id) AS confirmaciones
        FROM reportes r
        INNER JOIN usuarios u ON r.ciudadano_id = u.id
        WHERE COALESCE(r.eliminado, false) = false
        ORDER BY r.verificado_admin ASC, r.fecha_creacion DESC
    `);
    return result.rows;
}

// HU013: Reportes de otros ciudadanos para confirmar
export async function getReportesParaConfirmar(ciudadanoId: string): Promise<Array<{
    id: string; codigo: string; titulo: string; categoria: string; estado: string;
    foto?: string; fecha_creacion: string; direccion: string; nombre: string;
    confirmaciones: number; ya_confirme: boolean;
}>> {
    const result = await db.query(`
        SELECT r.id, r.codigo, r.titulo, r.categoria, r.estado,
               r.foto, r.fecha_creacion::text AS fecha_creacion, r.direccion, u.nombre,
               (SELECT COUNT(*)::int FROM confirmaciones_reporte c WHERE c.reporte_id = r.id) AS confirmaciones,
               EXISTS(SELECT 1 FROM confirmaciones_reporte c WHERE c.reporte_id = r.id AND c.ciudadano_id = $1) AS ya_confirme
        FROM reportes r
        INNER JOIN usuarios u ON r.ciudadano_id = u.id
        WHERE r.ciudadano_id != $1
          AND COALESCE(r.eliminado, false) = false
          AND r.estado IN ('Pendiente','En Proceso')
        ORDER BY r.fecha_creacion DESC
        LIMIT 50
    `, [ciudadanoId]);
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

// Polígono oficial de Providencia obtenido de la API MINVU GeoIDE:
// GET https://geoide.minvu.cl/server/rest/services/IPT/Limites_Urbanos/MapServer/0/query?where=COM='Providencia'&f=geojson&outSR=4326
const PROVIDENCIA_WKT = `POLYGON((-70.598377 -33.420423,-70.598618 -33.420257,-70.599227 -33.419836,-70.599265 -33.419809,-70.599473 -33.419654,-70.599835 -33.419385,-70.600322 -33.419022,-70.600763 -33.418695,-70.600975 -33.418537,-70.601458 -33.418178,-70.601879 -33.417909,-70.602339 -33.417655,-70.602893 -33.417456,-70.603364 -33.417384,-70.603966 -33.417347,-70.604414 -33.417275,-70.604828 -33.417193,-70.604944 -33.417141,-70.606762 -33.416180,-70.606905 -33.416164,-70.607448 -33.416105,-70.607771 -33.416074,-70.607266 -33.414935,-70.606838 -33.413351,-70.606581 -33.412400,-70.606469 -33.412105,-70.606461 -33.412086,-70.605460 -33.409283,-70.605459 -33.409283,-70.605460 -33.409282,-70.605383 -33.409079,-70.606087 -33.409225,-70.606233 -33.409256,-70.606242 -33.409273,-70.608627 -33.409242,-70.612954 -33.409187,-70.613917 -33.409056,-70.613941 -33.409056,-70.614088 -33.409135,-70.614924 -33.409735,-70.615207 -33.409994,-70.615880 -33.410623,-70.616026 -33.410709,-70.616065 -33.410756,-70.616321 -33.410882,-70.616984 -33.411271,-70.617682 -33.412115,-70.618168 -33.412634,-70.619863 -33.413888,-70.620856 -33.414499,-70.621540 -33.414937,-70.622185 -33.415415,-70.623071 -33.416185,-70.623944 -33.416865,-70.624578 -33.417817,-70.625072 -33.418020,-70.625838 -33.418639,-70.626696 -33.419057,-70.628539 -33.419853,-70.628997 -33.419959,-70.629756 -33.420140,-70.632184 -33.421899,-70.632624 -33.422831,-70.632478 -33.424143,-70.632980 -33.425196,-70.633630 -33.426196,-70.635836 -33.429687,-70.636006 -33.429858,-70.636020 -33.429953,-70.636037 -33.430064,-70.636093 -33.430242,-70.636105 -33.430282,-70.636181 -33.430452,-70.636198 -33.430489,-70.636199 -33.430486,-70.636199 -33.430492,-70.636265 -33.430640,-70.636235 -33.430793,-70.636220 -33.430892,-70.636192 -33.431054,-70.636192 -33.431059,-70.636006 -33.432159,-70.635881 -33.432856,-70.635880 -33.432863,-70.635792 -33.433349,-70.635586 -33.434586,-70.635548 -33.434814,-70.635380 -33.435691,-70.635378 -33.435828,-70.635375 -33.435945,-70.635373 -33.436052,-70.635367 -33.436328,-70.635365 -33.436405,-70.635326 -33.436827,-70.635205 -33.437104,-70.635184 -33.437272,-70.635177 -33.437327,-70.635079 -33.437697,-70.635074 -33.437718,-70.635059 -33.437804,-70.634980 -33.438272,-70.634966 -33.438355,-70.634846 -33.438655,-70.634717 -33.439090,-70.634606 -33.439454,-70.634597 -33.439483,-70.634573 -33.439563,-70.634540 -33.439679,-70.634426 -33.440088,-70.634412 -33.440133,-70.634244 -33.440690,-70.634206 -33.440815,-70.634166 -33.440947,-70.634144 -33.441022,-70.634031 -33.441394,-70.633893 -33.441853,-70.633773 -33.442264,-70.633728 -33.442421,-70.633695 -33.442534,-70.633689 -33.442556,-70.633476 -33.443287,-70.633220 -33.444195,-70.633173 -33.444362,-70.632991 -33.444979,-70.632867 -33.445401,-70.632708 -33.445916,-70.632690 -33.445977,-70.632246 -33.447415,-70.632120 -33.447859,-70.631898 -33.448641,-70.631830 -33.448870,-70.631716 -33.449249,-70.631597 -33.449646,-70.631545 -33.449820,-70.631479 -33.449806,-70.631133 -33.449741,-70.631107 -33.449736,-70.630172 -33.449561,-70.629881 -33.449506,-70.629649 -33.449456,-70.629204 -33.449366,-70.629204 -33.449365,-70.628956 -33.449314,-70.628318 -33.449205,-70.628316 -33.449205,-70.627972 -33.449146,-70.627646 -33.449086,-70.626759 -33.448925,-70.626232 -33.448780,-70.625682 -33.448640,-70.625363 -33.448558,-70.625184 -33.448523,-70.625167 -33.448520,-70.624867 -33.448461,-70.624822 -33.448452,-70.624476 -33.448384,-70.624004 -33.448291,-70.623977 -33.448286,-70.623696 -33.448231,-70.623227 -33.448138,-70.622622 -33.448019,-70.622252 -33.447946,-70.621832 -33.447863,-70.621825 -33.447862,-70.621216 -33.447741,-70.621175 -33.447733,-70.620892 -33.447677,-70.619846 -33.447475,-70.618978 -33.447292,-70.618763 -33.447246,-70.618648 -33.447654,-70.618435 -33.448368,-70.617794 -33.448250,-70.617092 -33.448124,-70.616497 -33.448013,-70.616168 -33.447949,-70.616153 -33.447946,-70.615947 -33.447906,-70.614530 -33.447681,-70.614444 -33.447668,-70.614299 -33.447645,-70.614296 -33.447644,-70.614033 -33.447603,-70.613735 -33.447555,-70.613811 -33.447147,-70.613877 -33.446818,-70.613880 -33.446804,-70.613644 -33.446770,-70.613632 -33.446768,-70.613531 -33.446753,-70.613432 -33.446739,-70.613390 -33.446733,-70.613185 -33.446704,-70.613153 -33.446699,-70.611602 -33.446475,-70.611286 -33.446430,-70.611168 -33.446414,-70.610783 -33.446298,-70.610711 -33.446277,-70.610332 -33.446163,-70.610000 -33.446067,-70.609447 -33.445907,-70.609079 -33.445796,-70.608753 -33.445724,-70.608409 -33.445675,-70.608066 -33.445625,-70.607158 -33.445530,-70.607018 -33.445513,-70.606969 -33.445507,-70.606719 -33.445476,-70.606713 -33.445475,-70.606158 -33.445408,-70.605622 -33.445334,-70.605600 -33.445331,-70.605475 -33.445314,-70.605436 -33.445309,-70.605380 -33.445298,-70.605380 -33.445298,-70.604350 -33.445160,-70.603306 -33.445050,-70.603284 -33.445047,-70.602901 -33.445007,-70.602599 -33.444976,-70.602545 -33.444971,-70.602190 -33.444935,-70.601913 -33.444906,-70.601748 -33.444891,-70.601424 -33.444857,-70.601396 -33.444854,-70.601100 -33.444824,-70.600887 -33.444804,-70.600885 -33.444803,-70.599775 -33.444698,-70.599769 -33.444697,-70.599747 -33.444695,-70.599630 -33.444684,-70.599567 -33.444678,-70.599518 -33.444673,-70.599177 -33.444641,-70.598155 -33.444526,-70.598124 -33.444797,-70.598033 -33.444801,-70.597243 -33.445249,-70.596079 -33.445980,-70.595263 -33.446422,-70.594447 -33.446865,-70.593672 -33.447290,-70.593623 -33.447317,-70.592799 -33.447769,-70.592636 -33.447567,-70.592621 -33.447549,-70.592608 -33.447533,-70.592533 -33.447440,-70.592261 -33.447118,-70.592020 -33.446836,-70.591723 -33.446489,-70.591607 -33.446309,-70.591388 -33.445978,-70.591376 -33.445959,-70.591246 -33.445756,-70.591135 -33.445583,-70.590990 -33.445347,-70.590693 -33.444877,-70.590388 -33.444412,-70.590383 -33.444406,-70.590213 -33.444141,-70.590211 -33.444138,-70.589838 -33.443558,-70.589490 -33.443021,-70.588595 -33.441604,-70.588190 -33.440975,-70.588142 -33.440900,-70.587671 -33.440162,-70.587152 -33.439415,-70.587000 -33.439197,-70.586428 -33.438556,-70.586179 -33.438275,-70.586167 -33.438261,-70.586046 -33.438125,-70.585375 -33.437378,-70.585063 -33.437023,-70.584970 -33.436919,-70.584604 -33.436512,-70.584215 -33.436092,-70.583834 -33.435657,-70.583460 -33.435218,-70.583101 -33.434810,-70.582600 -33.434237,-70.582546 -33.434175,-70.582543 -33.434172,-70.582384 -33.433990,-70.582265 -33.433807,-70.582262 -33.433803,-70.582230 -33.433754,-70.582895 -33.433326,-70.583623 -33.432678,-70.584364 -33.431773,-70.584396 -33.431727,-70.584437 -33.431687,-70.585046 -33.431096,-70.585601 -33.430557,-70.585740 -33.430436,-70.585937 -33.430265,-70.586574 -33.429710,-70.587364 -33.429021,-70.587465 -33.428933,-70.587857 -33.428608,-70.588822 -33.427809,-70.589637 -33.427174,-70.590433 -33.426555,-70.590896 -33.426195,-70.592361 -33.425054,-70.592923 -33.424617,-70.593180 -33.424417,-70.594054 -33.423738,-70.594442 -33.423437,-70.595253 -33.422794,-70.595332 -33.422732,-70.596591 -33.421734,-70.596836 -33.421554,-70.596907 -33.421502,-70.597304 -33.421211,-70.597837 -33.420819,-70.598377 -33.420423))`;

// HU012: Verificar si coordenadas están dentro de Providencia (polígono oficial MINVU GeoIDE)
export async function verificarDentroProvidencia(lat: number, lng: number): Promise<boolean> {
    const result = await db.query<{ dentro: boolean }>(
        `SELECT ST_Contains(
            ST_GeomFromText($1, 4326),
            ST_SetSRID(ST_MakePoint($3, $2), 4326)
        ) AS dentro`,
        [PROVIDENCIA_WKT, lat, lng]
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
