import { Router } from 'express';
import { obtenerMapaCalor, exportarCSV } from './heatmap.controller';
import { soloAdministrador } from '../../middlewares';

const router = Router();
router.use(soloAdministrador);
router.get('/',         obtenerMapaCalor);
router.get('/exportar', exportarCSV);

export default router;
