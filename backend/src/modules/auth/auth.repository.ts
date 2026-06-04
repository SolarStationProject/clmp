import { db } from '../../config/database';
import { Usuario } from '../../shared/types';

export async function findByEmail(email: string): Promise<Usuario | null> {
    const result = await db.query<Usuario>(
        'SELECT * FROM usuarios WHERE email = $1',
        [email]
    );
    return result.rows[0] ?? null;
}

export async function findById(id: string): Promise<Usuario | null> {
    const result = await db.query<Usuario>(
        'SELECT id, nombre, email, rol, verificado, fecha_registro FROM usuarios WHERE id = $1',
        [id]
    );
    return result.rows[0] ?? null;
}

export async function createUsuario(
    nombre: string,
    email: string,
    hashedPassword: string,
    rol: 'Administrador' | 'Ciudadano'
): Promise<Usuario> {
    const result = await db.query<Usuario>(
        `INSERT INTO usuarios (nombre, email, password, rol, verificado)
         VALUES ($1, $2, $3, $4, false)
         RETURNING id, nombre, email, rol, verificado, fecha_registro`,
        [nombre, email, hashedPassword, rol]
    );
    return result.rows[0];
}

export async function marcarVerificado(email: string): Promise<void> {
    await db.query('UPDATE usuarios SET verificado = true WHERE email = $1', [email]);
}

export async function updatePassword(email: string, hashedPassword: string): Promise<void> {
    await db.query('UPDATE usuarios SET password = $1 WHERE email = $2', [hashedPassword, email]);
}

// HU002: Intentos de login para bloqueo tras 5 fallos en 15 minutos
export async function contarIntentosRecientes(email: string): Promise<number> {
    const result = await db.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM intentos_login
         WHERE email = $1 AND fecha > NOW() - INTERVAL '15 minutes'`,
        [email]
    );
    return parseInt(result.rows[0].count, 10);
}

export async function registrarIntento(email: string): Promise<void> {
    await db.query('INSERT INTO intentos_login (email) VALUES ($1)', [email]);
}

export async function limpiarIntentos(email: string): Promise<void> {
    await db.query('DELETE FROM intentos_login WHERE email = $1', [email]);
}

// ── Tokens de verificación (HU001 y HU003) ────────────────────────────────────

export async function guardarToken(
    email: string,
    token: string,
    tipo: 'registro' | 'recuperacion',
    minutosExpiracion: number
): Promise<void> {
    // Invalida tokens anteriores del mismo tipo para este email
    await db.query(
        `UPDATE tokens_verificacion SET usado = true
         WHERE email = $1 AND tipo = $2 AND usado = false`,
        [email, tipo]
    );
    await db.query(
        `INSERT INTO tokens_verificacion (email, token, tipo, expira_en)
         VALUES ($1, $2, $3, NOW() + INTERVAL '${minutosExpiracion} minutes')`,
        [email, token, tipo]
    );
}

export async function verificarToken(
    email: string,
    token: string,
    tipo: 'registro' | 'recuperacion'
): Promise<boolean> {
    const result = await db.query(
        `SELECT id FROM tokens_verificacion
         WHERE email = $1 AND token = $2 AND tipo = $3
           AND usado = false AND expira_en > NOW()`,
        [email, token, tipo]
    );
    if (result.rowCount === 0) return false;
    await db.query(
        'UPDATE tokens_verificacion SET usado = true WHERE email = $1 AND token = $2',
        [email, token]
    );
    return true;
}

export async function buscarTokenRecuperacion(token: string): Promise<{ email: string } | null> {
    const result = await db.query<{ email: string }>(
        `SELECT email FROM tokens_verificacion
         WHERE token = $1 AND tipo = 'recuperacion' AND usado = false AND expira_en > NOW()`,
        [token]
    );
    return result.rows[0] ?? null;
}
