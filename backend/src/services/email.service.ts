import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host:   process.env.MAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.MAIL_PORT || '587'),
    secure: false, // STARTTLS en puerto 587
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

// Gmail muestra la dirección real de la cuenta aunque se defina otra en "from".
// El nombre "CleanMap" sí aparece en el cliente de email.
const FROM        = `CleanMap <${process.env.MAIL_USER}>`;
const BASE_URL    = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Estilos base compartidos ─────────────────────────────────────────────────
const card = `max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;`;
const header = `background:linear-gradient(135deg,#005c2e 0%,#0a7c40 100%);padding:32px 40px;text-align:center;`;
const body   = `padding:32px 40px;`;
const footer = `background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;line-height:1.6;`;

function wrap(headerSub: string, bodyHtml: string): string {
    return `
    <html><body style="background:#f1f5f9;margin:0;padding:0;">
    <div style="${card}">
        <div style="${header}">
            <div style="font-size:32px">🗺️</div>
            <h1 style="color:#fff;margin:8px 0 4px;font-size:22px;font-weight:800">CleanMap</h1>
            <p style="color:rgba(255,255,255,0.75);margin:0;font-size:13px">Universidad Andrés Bello · 2026</p>
            <p style="color:rgba(255,255,255,0.9);margin:12px 0 0;font-size:14px;font-weight:600">${headerSub}</p>
        </div>
        <div style="${body}">${bodyHtml}</div>
        <div style="${footer}">
            Este mensaje fue generado automáticamente por CleanMap.<br/>
            Sistema de Gestión de Microbasurales — UNAB 2026
        </div>
    </div>
    </body></html>`;
}

// ── HU001: Código de verificación ────────────────────────────────────────────
export async function enviarCodigoVerificacion(
    email: string,
    nombre: string,
    codigo: string
): Promise<void> {
    const html = wrap('Verificación de cuenta', `
        <p style="color:#374151;font-size:15px;margin:0 0 8px">Hola, <strong>${nombre}</strong> 👋</p>
        <p style="color:#64748b;font-size:14px;margin:0 0 24px;line-height:1.6">
            Gracias por registrarte en CleanMap. Usa el siguiente código para verificar tu cuenta.
            Es válido por <strong>1 hora</strong>.
        </p>
        <div style="background:#F0FDF4;border:2px solid #86EFAC;border-radius:14px;padding:24px;text-align:center;margin:0 0 24px">
            <p style="color:#64748b;font-size:13px;margin:0 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em">
                Código de verificación
            </p>
            <p style="color:#005c2e;font-size:42px;font-weight:900;letter-spacing:0.25em;margin:0;font-family:monospace">
                ${codigo}
            </p>
        </div>
        <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.6">
            Si no creaste esta cuenta, puedes ignorar este mensaje.<br/>
            El código expira automáticamente en 1 hora.
        </p>
    `);

    await transporter.sendMail({
        from:    FROM,
        to:      email,
        subject: `${codigo} — Tu código de verificación CleanMap`,
        html,
    });
}

// ── HU002: Confirmación de inicio de sesión ───────────────────────────────────
export async function enviarConfirmacionLogin(
    email: string,
    nombre: string,
    rol: string
): Promise<void> {
    const ahora = new Date().toLocaleString('es-CL', {
        timeZone: 'America/Santiago',
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    const html = wrap('Inicio de sesión exitoso', `
        <p style="color:#374151;font-size:15px;margin:0 0 8px">Hola, <strong>${nombre}</strong></p>
        <p style="color:#64748b;font-size:14px;margin:0 0 24px;line-height:1.6">
            Se ha registrado un nuevo inicio de sesión en tu cuenta CleanMap.
        </p>
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin:0 0 24px">
            <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:40%">📅 Fecha y hora</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600">${ahora}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;font-size:13px">👤 Rol</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600">${rol}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;font-size:13px">🖥️ Plataforma</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600">${rol === 'Administrador' ? 'Panel web' : 'App móvil'}</td></tr>
            </table>
        </div>
        <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.6">
            Si no fuiste tú, <a href="${BASE_URL}/demo/hu003" style="color:#005c2e;font-weight:600">recupera tu contraseña aquí</a>.
        </p>
    `);

    await transporter.sendMail({
        from:    FROM,
        to:      email,
        subject: `Inicio de sesión en CleanMap — ${ahora}`,
        html,
    });
}

// ── HU006: Notificación de cambio de estado al ciudadano ─────────────────────
export async function enviarNotificacionCambioEstado(
    email: string,
    nombre: string,
    codigoReporte: string,
    tituloReporte: string,
    estadoAnterior: string,
    estadoNuevo: string,
    comentario?: string
): Promise<void> {
    const colores: Record<string, string> = {
        'Pendiente':  '#EF4444',
        'En Proceso': '#F59E0B',
        'Resuelto':   '#22C55E',
        'Rechazado':  '#6B7280',
    };
    const colorNuevo = colores[estadoNuevo] || '#64748b';
    const ahora = new Date().toLocaleString('es-CL', {
        timeZone: 'America/Santiago',
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    const html = wrap('Estado de tu reporte actualizado', `
        <p style="color:#374151;font-size:15px;margin:0 0 8px">Hola, <strong>${nombre}</strong></p>
        <p style="color:#64748b;font-size:14px;margin:0 0 20px;line-height:1.6">
            El estado de tu reporte ha sido actualizado por el equipo de CleanMap.
        </p>
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin:0 0 20px">
            <p style="color:#64748b;font-size:12px;margin:0 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Reporte</p>
            <p style="color:#1e293b;font-size:16px;font-weight:700;margin:0 0 16px">${tituloReporte}</p>
            <p style="color:#94a3b8;font-size:12px;margin:0 0 12px">${codigoReporte}</p>
            <div style="display:flex;align-items:center;gap:12px">
                <span style="background:#F3F4F6;color:#64748b;padding:6px 14px;border-radius:8px;font-size:13px;font-weight:600">${estadoAnterior}</span>
                <span style="color:#94a3b8;font-size:18px">→</span>
                <span style="background:${colorNuevo}20;color:${colorNuevo};padding:6px 14px;border-radius:8px;font-size:13px;font-weight:700;border:1px solid ${colorNuevo}40">${estadoNuevo}</span>
            </div>
        </div>
        ${comentario ? `
        <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px;margin:0 0 16px">
            <p style="color:#92400E;font-size:13px;font-weight:600;margin:0 0 4px">💬 Comentario del equipo:</p>
            <p style="color:#78350F;font-size:14px;margin:0">${comentario}</p>
        </div>` : ''}
        <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6">Actualizado el ${ahora}</p>
    `);

    await transporter.sendMail({
        from:    FROM,
        to:      email,
        subject: `[CleanMap] Tu reporte ${codigoReporte} cambió a: ${estadoNuevo}`,
        html,
    });
}

// ── HU003: Enlace de recuperación de contraseña ───────────────────────────────
export async function enviarEnlaceRecuperacion(
    email: string,
    nombre: string,
    token: string
): Promise<void> {
    const enlace = `${BASE_URL}/demo/hu003?token=${token}`;

    const html = wrap('Recuperación de contraseña', `
        <p style="color:#374151;font-size:15px;margin:0 0 8px">Hola, <strong>${nombre || 'usuario'}</strong></p>
        <p style="color:#64748b;font-size:14px;margin:0 0 24px;line-height:1.6">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta CleanMap.
            El enlace es válido durante <strong>1 hora</strong>.
        </p>
        <div style="text-align:center;margin:0 0 24px">
            <a href="${enlace}"
               style="display:inline-block;background:linear-gradient(135deg,#005c2e,#0a7c40);
                      color:#fff;font-weight:700;font-size:15px;text-decoration:none;
                      padding:14px 32px;border-radius:12px;">
                Restablecer contraseña →
            </a>
        </div>
        <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px;margin:0 0 20px">
            <p style="color:#92400E;font-size:13px;margin:0;line-height:1.6">
                ⚠️ Si el botón no funciona, copia este enlace en tu navegador:<br/>
                <span style="font-family:monospace;font-size:12px;color:#0284c7;word-break:break-all">${enlace}</span>
            </p>
        </div>
        <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.6">
            Si no solicitaste este cambio, ignora este mensaje.<br/>
            Tu contraseña actual permanece sin cambios.
        </p>
    `);

    await transporter.sendMail({
        from:    FROM,
        to:      email,
        subject: 'Restablece tu contraseña de CleanMap',
        html,
    });
}
