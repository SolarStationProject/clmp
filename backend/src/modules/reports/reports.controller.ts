import { Request, Response } from 'express';
import * as reportsService from './reports.service';
import * as reportsRepository from './reports.repository';
import * as emailService from '../../services/email.service';
import { EstadoReporte, RolUsuario } from '../../shared/types';

// HU010: Lista de reportes propios del ciudadano
export async function getReportesPropios(req: Request, res: Response): Promise<void> {
    const { ciudadanoId } = req.query;
    if (!ciudadanoId) {
        res.status(200).json({ success: true, data: [] });
        return;
    }
    try {
        const data = await reportsService.getReportesPropios(ciudadanoId as string);
        res.status(200).json({ success: true, data });
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

        const estado = await reportsService.actualizarEstadoReporte(reporteId, nuevoEstado as EstadoReporte);

        res.status(200).json({
            success: true,
            mensaje: 'Estado actualizado y ciudadano notificado',
            data:    { estado },
        });

        // Enviar email al ciudadano con estado anterior correcto (no bloqueante)
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
    const { titulo, descripcion, categoria, direccion, comuna, latitud, longitud } = req.body;
    if (!titulo || !descripcion || !categoria || !direccion || !comuna || !latitud || !longitud) {
        res.status(400).json({ success: false, message: 'Todos los campos son requeridos.' });
        return;
    }
    const foto = req.file ? `/uploads/reports/${req.file.filename}` : undefined;
    try {
        const data = await reportsService.crearReporte({
            ciudadano_id: ciudadanoId,
            titulo, descripcion, categoria,
            foto, direccion, comuna,
            latitud:  parseFloat(latitud),
            longitud: parseFloat(longitud),
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
