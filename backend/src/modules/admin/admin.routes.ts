import { Router } from 'express';
import { soloAdministrador } from '../../middlewares';
import { resetDatabase } from './admin.controller';

const router = Router();
router.post('/reset-db', soloAdministrador, resetDatabase);

export default router;
