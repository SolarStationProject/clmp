import * as repo from './reports.repository';
import { Reporte, DetalleReporteResponse, ValidacionReporte, EstadoReporte, RolUsuario } from '../../shared/types';

export const getReportesPropios = (ciudadanoId: string): Promise<Reporte[]> =>
    repo.findByOwnReportesId(ciudadanoId);

export const getDetalleReporte = (reporteId: string): Promise<DetalleReporteResponse | null> =>
    repo.findDetailsByReporteId(reporteId);

export const crearCambioHistorial = (
    reporteId: string,
    usuarioId: string,
    estadoAsignado: EstadoReporte,
    comentario: string
): Promise<Partial<ValidacionReporte>> =>
    repo.addChangeHistorialReportesId(reporteId, usuarioId, estadoAsignado, comentario);

export const actualizarEstadoReporte = (reporteId: string, nuevoEstado: EstadoReporte): Promise<string> =>
    repo.updatedEstadoReportesId(reporteId, nuevoEstado);

export const obtenerReportesPorRol = (usuarioId: string, usuarioRol: RolUsuario): Promise<Reporte[]> =>
    repo.obtenerTodos(usuarioId, usuarioRol);

export const crearReporte = (data: Parameters<typeof repo.insertReport>[0]): Promise<Reporte> =>
    repo.insertReport(data);
