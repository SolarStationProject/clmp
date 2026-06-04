import { Router } from 'express';
import {
    registrar,
    verificarEmail,
    login,
    solicitarRecuperacion,
    verificarTokenReset,
    restablecerPassword,
} from './auth.controller';

const router = Router();

// HU001
router.post('/register',            registrar);
router.post('/verify-email',        verificarEmail);

// HU002 + HU007
router.post('/login',               login);

// HU003
router.post('/recover',             solicitarRecuperacion);
router.get('/reset/:token',         verificarTokenReset);
router.post('/reset',               restablecerPassword);

export default router;
