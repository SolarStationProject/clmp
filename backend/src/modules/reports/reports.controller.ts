import { Request, Response } from 'express';
import * as reportsService from './reports.service';
import * as reportsRepository from './reports.repository';
import * as emailService from '../../services/email.service';
import { EstadoReporte, RolUsuario } from '../../shared/types';

// HU010/HU023: Lista de reportes propios del ciudadano
export async function getReportesPropios(req: Request, res: Response): Promise<void> {
    const { ciudadanoId, incluirEliminados } = req.query;
    if (!ciudadanoId) {
        res.status(200).json({ success: true, data: [] });
        return;
    }
    try {
        const data = await reportsRepository.findByOwnReportesId(
            ciudadanoId as string,
            incluirEliminados === 'true'
        );
        res.status(200).json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// HU019: Editar reporte en estado Pendiente
export async function editarReporte(req: Request, res: Response): Promise<void> {
    const { reporteId } = req.params;
    const ciudadanoId   = req.usuario!.id;
    const { titulo, descripcion, categoria, foto } = req.body;
    try {
        const data = await reportsRepository.editarReporte(reporteId, ciudadanoId, { titulo, descripcion, categoria, foto });
        if (!data) {
            res.status(404).json({ success: false, message: 'Reporte no encontrado o no está en estado Pendiente.' });
            return;
        }
        res.status(200).json({ success: true, mensaje: 'Reporte actualizado', data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// HU020: Eliminar reporte (soft delete)
export async function eliminarReporte(req: Request, res: Response): Promise<void> {
    const { reporteId } = req.params;
    const ciudadanoId   = req.usuario!.id;
    try {
        const ok = await reportsRepository.eliminarReporte(reporteId, ciudadanoId);
        if (!ok) {
            res.status(404).json({ success: false, message: 'Reporte no encontrado o no está en estado Pendiente.' });
            return;
        }
        res.status(200).json({ success: true, mensaje: 'Reporte eliminado correctamente.' });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// HU021: Detalle completo con filtro de privacidad según rol
export async function getDetalleReporte(req: Request, res: Response): Promise<void> {
    const { id, usuarioRol } = req.query;
    if (!id) {
        res.status(400).json({ success: false, message: 'El ID del reporte es requerido.' });
        return;
    }
    try {
        const detalle = await reportsService.getDetalleReporte(id as string);
        if (!detalle) {
            res.status(404).json({ success: false, message: 'Reporte no encontrado.' });
            return;
        }
        // HU021: solo Administrador ve comentarios internos
        if (usuarioRol !== 'Administrador') {
            delete detalle.comentarios_internos;
        }
        res.status(200).json({ success: true, data: detalle });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// HU006: Insertar hito en historial de cambios
export async function crearCambioHistorial(req: Request, res: Response): Promise<void> {
    const { reporteId } = req.params;
    const { estadoAsignado, comentario } = req.body;
    const usuarioId = req.usuario?.id;
    if (!usuarioId || !estadoAsignado || !comentario) {
        res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
        return;
    }
    try {
        const data = await reportsService.crearCambioHistorial(reporteId, usuarioId, estadoAsignado as EstadoReporte, comentario);
        res.status(201).json({ success: true, data });
    } catch (err: any) {
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
}

// HU006: Actualizar estado del reporte
export async function actualizarEstadoReporte(req: Request, res: Response): Promise<void> {
    const { reporteId } = req.params;
    const { nuevoEstado, comentario } = req.body;
    if (!reporteId || !nuevoEstado) {
        res.status(400).json({ success: false, message: 'ID y nuevo estado son obligatorios.' });
        return;
    }
    try {
        // Leer estado anterior ANTES del update para el email
        const infoAntes = await reportsRepository.getReporteConCiudadano(reporteId);
        const estadoAnterior = infoAntes?.estado ?? 'Pendiente';

        const adminId = (req.usuario as { id: string }).id;
        const estado  = await reportsService.actualizarEstadoReporte(reporteId, nuevoEstado as EstadoReporte);

        // Registrar en historial público (validacion_reportes)
        const mensajeHistorial = comentario || `Estado cambiado a ${nuevoEstado}`;
        await reportsService.crearCambioHistorial(reporteId, adminId, nuevoEstado as EstadoReporte, mensajeHistorial);

        // Guardar comentario interno si fue ingresado (solo visible para admins en HU021)
        if (comentario?.trim()) {
            await reportsRepository.insertComentarioInterno(reporteId, adminId, comentario.trim());
        }

        res.status(200).json({
            success: true,
            mensaje: 'Estado actualizado y ciudadano notificado',
            data:    { estado },
        });

        // Email no bloqueante
        if (infoAntes) {
            emailService.enviarNotificacionCambioEstado(
                infoAntes.ciudadano_email,
                infoAntes.ciudadano_nombre,
                infoAntes.codigo,
                infoAntes.titulo,
                estadoAnterior,
                nuevoEstado as EstadoReporte,
                comentario
            ).catch(err => console.error('[Email] Notificación fallida:', err.message));
        }
    } catch (err: any) {
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
}

// Lista de todos los reportes según rol
export async function obtenerReportes(req: Request, res: Response): Promise<void> {
    const { usuarioId, usuarioRol } = req.query;
    if (!usuarioId || !usuarioRol) {
        res.status(401).json({ status: 'error', message: 'Faltan credenciales de sesión.' });
        return;
    }
    try {
        const data = await reportsService.obtenerReportesPorRol(usuarioId as string, usuarioRol as RolUsuario);
        res.status(200).json({ status: 'success', results: data.length, data });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
}

// HU004: Crear reporte con foto y GPS
export async function crearReporte(req: Request, res: Response): Promise<void> {
    const ciudadanoId = req.usuario?.id;
    if (!ciudadanoId) {
        res.status(401).json({ success: false, message: 'No autorizado.' });
        return;
    }
    const { titulo, descripcion, categoria, direccion, comuna, latitud, longitud, foto: fotoBase64 } = req.body;
    if (!titulo || !descripcion || !categoria || !direccion || !comuna || !latitud || !longitud) {
        res.status(400).json({ success: false, message: 'Todos los campos son requeridos.' });
        return;
    }
    // Acepta foto como archivo multer (multipart) O como base64 en el body JSON
    const foto = req.file ? `/uploads/reports/${req.file.filename}` : (fotoBase64 || undefined);
    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);
    try {
        // HU012: Validar que las coordenadas estén dentro de Providencia
        const dentroProvidencia = await reportsRepository.verificarDentroProvidencia(lat, lng);
        if (!dentroProvidencia) {
            res.status(400).json({ success: false, message: 'CleanMap solo acepta reportes dentro de la comuna de Providencia.' });
            return;
        }

        // HU022: Verificar duplicados a 50m (saltar si el ciudadano confirma forzar)
        if (!req.body.forzar) {
            const duplicados = await reportsRepository.checkDuplicados(lat, lng);
            if (duplicados.length > 0) {
                res.status(409).json({
                    success: false,
                    message: `Hay ${duplicados.length} reporte(s) existente(s) a menos de 50 metros.`,
                    duplicados,
                });
                return;
            }
        }

        const data = await reportsService.crearReporte({
            ciudadano_id: ciudadanoId,
            titulo, descripcion, categoria,
            foto, direccion, comuna,
            latitud:  lat,
            longitud: lng,
        });
        res.status(201).json({
            success: true,
            mensaje: 'Reporte creado con estado Pendiente',
            data,
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// HU012: Verificar si coordenadas están dentro de Providencia
export async function checkComuna(req: Request, res: Response): Promise<void> {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    if (isNaN(lat) || isNaN(lng)) {
        res.status(400).json({ success: false, message: 'Coordenadas inválidas.' });
        return;
    }
    try {
        const dentro = await reportsRepository.verificarDentroProvidencia(lat, lng);
        res.status(200).json({ success: true, dentro, mensaje: dentro ? 'Dentro de Providencia' : 'Fuera de Providencia' });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// HU022: Verificar duplicados a 50m
export async function checkDuplicado(req: Request, res: Response): Promise<void> {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    if (isNaN(lat) || isNaN(lng)) {
        res.status(400).json({ success: false, message: 'Coordenadas inválidas.' });
        return;
    }
    try {
        const duplicados = await reportsRepository.checkDuplicados(lat, lng);
        res.status(200).json({ success: true, duplicados, hayDuplicados: duplicados.length > 0 });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
}
