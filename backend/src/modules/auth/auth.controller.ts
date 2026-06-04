import { Request, Response } from 'express';
import * as authService from './auth.service';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

// HU001 — Paso 1: Crear cuenta y enviar código por email
export async function registrar(req: Request, res: Response): Promise<void> {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) {
        res.status(400).json({ error: 'Nombre, email y contraseña son requeridos.' });
        return;
    }
    if (!PASSWORD_REGEX.test(password)) {
        res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.' });
        return;
    }
    try {
        const resultado = await authService.registrar(nombre, email, password);
        res.status(201).json(resultado);
    } catch (err: any) {
        res.status(err.status || 500).json({ error: err.message });
    }
}

// HU001 — Paso 2: Verificar código de 6 dígitos
export async function verificarEmail(req: Request, res: Response): Promise<void> {
    const { email, codigo } = req.body;
    if (!email || !codigo) {
        res.status(400).json({ error: 'Email y código son requeridos.' });
        return;
    }
    try {
        const resultado = await authService.verificarEmail(email, codigo);
        res.status(200).json(resultado);
    } catch (err: any) {
        res.status(err.status || 500).json({ error: err.message });
    }
}

// HU002 — Login con email + contraseña + plataforma
export async function login(req: Request, res: Response): Promise<void> {
    const { email, password, plataforma } = req.body;
    if (!email || !password || !plataforma) {
        res.status(400).json({ error: 'Email, contraseña y plataforma son requeridos.' });
        return;
    }
    if (!['web', 'movil'].includes(plataforma)) {
        res.status(400).json({ error: 'Plataforma debe ser "web" o "movil".' });
        return;
    }
    try {
        const { token, usuario } = await authService.login(email, password, plataforma);
        res.status(200).json({
            mensaje: 'Acceso correcto al sistema',
            token,
            usuario,
        });
    } catch (err: any) {
        res.status(err.status || 500).json({
            error:  err.message,
            accion: (err as any).accion ?? undefined,
        });
    }
}

// HU003 — Solicitar enlace de recuperación (envía email)
export async function solicitarRecuperacion(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ error: 'El correo es requerido.' });
        return;
    }
    try {
        const resultado = await authService.solicitarRecuperacion(email);
        res.status(200).json(resultado);
    } catch (err: any) {
        res.status(err.status || 500).json({ error: err.message });
    }
}

// HU003 — Verificar que el token del enlace es válido (para mostrar el formulario)
export async function verificarTokenReset(req: Request, res: Response): Promise<void> {
    const { token } = req.params;
    try {
        const { email } = await authService.verificarTokenReset(token);
        res.status(200).json({ valido: true, email });
    } catch (err: any) {
        res.status(err.status || 400).json({ valido: false, error: err.message });
    }
}

// HU003 — Confirmar nueva contraseña con token + nueva contraseña
export async function restablecerPassword(req: Request, res: Response): Promise<void> {
    const { token, nuevaPassword } = req.body;
    if (!token || !nuevaPassword) {
        res.status(400).json({ error: 'Token y nueva contraseña son requeridos.' });
        return;
    }
    if (!PASSWORD_REGEX.test(nuevaPassword)) {
        res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.' });
        return;
    }
    try {
        const resultado = await authService.restablecerPassword(token, nuevaPassword);
        res.status(200).json(resultado);
    } catch (err: any) {
        res.status(err.status || 500).json({ error: err.message });
    }
}
