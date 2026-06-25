import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as authRepository from './auth.repository';
import * as emailService from '../../services/email.service';
import { Usuario } from '../../shared/types';

const SALT_ROUNDS  = 10;
const MAX_INTENTOS = 5;
const secret    = () => process.env.JWT_SECRET || 'dev_secret_change_in_production';
const expiresIn = process.env.JWT_EXPIRES_IN   || '7d';

// ── HU001: Registro (paso 1 — crea usuario pendiente y envía código) ──────────
export async function registrar(
    nombre: string,
    email: string,
    password: string
): Promise<{ mensaje: string }> {
    const existente = await authRepository.findByEmail(email);
    if (existente) throw Object.assign(new Error('El correo ya está registrado.'), { status: 409 });

    const hash   = await bcrypt.hash(password, SALT_ROUNDS);
    await authRepository.createUsuario(nombre, email, hash, 'Ciudadano');

    // Código de 6 dígitos válido 60 minutos
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    await authRepository.guardarToken(email, codigo, 'registro', 60);

    // Envío de email no bloqueante — si falla, el usuario igual puede usar el código
    let emailEnviado = true;
    try {
        await emailService.enviarCodigoVerificacion(email, nombre, codigo);
    } catch (err: any) {
        emailEnviado = false;
        console.error('[Email] Error enviando código de verificación:', err.message);
    }

    return {
        mensaje: emailEnviado
            ? 'Código de verificación enviado al correo'
            : `Cuenta creada. Email no disponible — código de verificación: ${codigo}`,
    };
}

// ── HU001: Registro (paso 2 — verifica código y activa cuenta) ────────────────
export async function verificarEmail(
    email: string,
    codigo: string
): Promise<{ mensaje: string }> {
    const valido = await authRepository.verificarToken(email, codigo, 'registro');
    if (!valido) throw Object.assign(new Error('Código incorrecto o expirado.'), { status: 400 });

    await authRepository.marcarVerificado(email);
    return { mensaje: 'Cuenta creada exitosamente' };
}

// ── HU002: Login ──────────────────────────────────────────────────────────────
export async function login(
    email: string,
    password: string,
    plataforma: 'web' | 'movil'
): Promise<{ token: string; usuario: Omit<Usuario, 'password'> }> {
    const intentos = await authRepository.contarIntentosRecientes(email);
    if (intentos >= MAX_INTENTOS) {
        throw Object.assign(
            new Error('Cuenta bloqueada temporalmente. Intente nuevamente en 15 minutos.'),
            { status: 429 }
        );
    }

    const usuario = await authRepository.findByEmail(email);
    if (!usuario) {
        await authRepository.registrarIntento(email);
        throw Object.assign(new Error('Credenciales inválidas.'), { status: 401 });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password!);
    if (!passwordValida) {
        await authRepository.registrarIntento(email);
        throw Object.assign(new Error('Credenciales inválidas.'), { status: 401 });
    }

    // HU007: Control de acceso por plataforma y rol
    if (usuario.rol === 'Administrador' && plataforma !== 'web') {
        throw Object.assign(
            new Error('Los administradores solo pueden acceder desde la plataforma web.'),
            { status: 403, accion: 'acceso_denegado' }
        );
    }
    if (usuario.rol === 'Ciudadano' && plataforma !== 'movil' && plataforma !== 'web') {
        throw Object.assign(
            new Error('Para reportar incidentes, descarga nuestra aplicación móvil.'),
            { status: 403, accion: 'redirigir_descarga' }
        );
    }

    await authRepository.limpiarIntentos(email);

    const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, secret(), { expiresIn } as any);
    const { password: _, ...usuarioSinPassword } = usuario;

    // Enviar confirmación de login (no bloqueante — si falla no rompe el login)
    emailService.enviarConfirmacionLogin(email, usuario.nombre, usuario.rol).catch(
        err => console.error('[Email] Confirmación de login fallida:', err.message)
    );

    return { token, usuario: usuarioSinPassword };
}

// ── HU003: Solicitar recuperación (envía enlace con token UUID) ───────────────
export async function solicitarRecuperacion(email: string): Promise<{ mensaje: string }> {
    const usuario = await authRepository.findByEmail(email);

    if (usuario) {
        const token = crypto.randomUUID();
        await authRepository.guardarToken(email, token, 'recuperacion', 60);
        await emailService.enviarEnlaceRecuperacion(email, usuario.nombre, token);
    }
    // Respuesta idéntica exista o no el email (seguridad: no revelar si el correo está registrado)
    return { mensaje: 'Si el correo existe, recibirás un enlace de recuperación.' };
}

// ── HU003: Verificar token de reset ──────────────────────────────────────────
export async function verificarTokenReset(token: string): Promise<{ email: string }> {
    const resultado = await authRepository.buscarTokenRecuperacion(token);
    if (!resultado) throw Object.assign(new Error('Enlace inválido o expirado.'), { status: 400 });
    return resultado;
}

// ── HU003: Confirmar nueva contraseña ─────────────────────────────────────────
export async function restablecerPassword(token: string, nuevaPassword: string): Promise<{ mensaje: string }> {
    const { email } = await verificarTokenReset(token);
    const hash = await bcrypt.hash(nuevaPassword, SALT_ROUNDS);
    await authRepository.updatePassword(email, hash);
    // Invalida el token usado
    await authRepository.verificarToken(email, token, 'recuperacion');
    return { mensaje: 'Contraseña restablecida' };
}
