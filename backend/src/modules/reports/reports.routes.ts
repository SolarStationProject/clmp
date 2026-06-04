import { Router } from 'express';
import {
    getReportesPropios,
    getDetalleReporte,
    crearCambioHistorial,
    actualizarEstadoReporte,
    obtenerReportes,
    crearReporte,
} from './reports.controller';
import { soloAdministrador, soloCiudadano } from '../../middlewares';
import { upload } from '../../middlewares';

const router = Router();

router.get('/my-reports', getReportesPropios);
router.get('/',           obtenerReportes);
router.get('/:id',        getDetalleReporte);

// HU004: Crear reporte (solo Ciudadano, con foto opcional)
router.post('/crear', soloCiudadano, upload.single('foto'), crearReporte);

// HU006: Operaciones de administración (solo Administrador)
router.post('/:reporteId/history', soloAdministrador, crearCambioHistorial);
router.put('/:reporteId/status',   soloAdministrador, actualizarEstadoReporte);

export default router;
