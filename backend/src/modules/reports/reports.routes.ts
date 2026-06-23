import { Router } from 'express';
import {
    getReportesPropios,
    getDetalleReporte,
    crearCambioHistorial,
    actualizarEstadoReporte,
    obtenerReportes,
    crearReporte,
    editarReporte,
    eliminarReporte,
    checkComuna,
    checkDuplicado,
} from './reports.controller';
import { soloAdministrador, soloCiudadano } from '../../middlewares';
import { upload } from '../../middlewares';

const router = Router();

router.get('/my-reports',      getReportesPropios);
router.get('/check-comuna',    checkComuna);
router.get('/check-duplicado', checkDuplicado);
router.get('/',                obtenerReportes);
router.get('/:id',             getDetalleReporte);

// HU004: Crear reporte (solo Ciudadano, con foto opcional)
router.post('/crear', soloCiudadano, upload.single('foto'), crearReporte);

// HU019: Editar reporte (solo Ciudadano dueño, solo si Pendiente)
router.put('/:reporteId/editar',   soloCiudadano, upload.single('foto'), editarReporte);

// HU020: Eliminar reporte soft delete (solo Ciudadano dueño, solo si Pendiente)
router.delete('/:reporteId',       soloCiudadano, eliminarReporte);

// HU006: Operaciones de administración (solo Administrador)
router.post('/:reporteId/history', soloAdministrador, crearCambioHistorial);
router.put('/:reporteId/status',   soloAdministrador, actualizarEstadoReporte);

export default router;
