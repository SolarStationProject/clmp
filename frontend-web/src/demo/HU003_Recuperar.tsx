// HU003 — Recuperar contraseña (llamadas reales al backend)
// Resultado esperado: "Contraseña restablecida"
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DemoShell, { SuccessMessage, ErrorMessage, FormField, inputStyle, btnStyle, Card } from './DemoShell';
import { API_BASE } from './useSession';

type Paso = 'email' | 'enviado' | 'nueva' | 'exito';
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function HU003_Recuperar() {
    const [searchParams]           = useSearchParams();
    const [paso,       setPaso]    = useState<Paso>('email');
    const [email,      setEmail]   = useState('');
    const [token,      setToken]   = useState('');
    const [nueva,      setNueva]   = useState('');
    const [confirma,   setConfirma]= useState('');
    const [cargando,   setCargando]= useState(false);
    const [error,      setError]   = useState('');

    // Si llega con ?token=xxx en la URL (clic desde el email), ir directo al paso de nueva contraseña
    useEffect(() => {
        const t = searchParams.get('token');
        if (t) { setToken(t); setPaso('nueva'); }
    }, []);

    const handleEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCargando(true);
        try {
            const res  = await fetch(`${API_BASE}/api/auth/recover`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Error al solicitar recuperación.'); return; }
            setPaso('enviado');
        } catch {
            setError('No se pudo conectar con el servidor. ¿Está corriendo el backend?');
        } finally {
            setCargando(false);
        }
    };

    const handleNueva = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!PASSWORD_RE.test(nueva)) { setError('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.'); return; }
        if (nueva !== confirma)        { setError('Las contraseñas no coinciden.'); return; }
        setCargando(true);
        try {
            const res  = await fetch(`${API_BASE}/api/auth/reset`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ token, nuevaPassword: nueva }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Error al restablecer contraseña.'); return; }
            setPaso('exito');
        } catch {
            setError('No se pudo conectar con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    const resetear = () => { setPaso('email'); setEmail(''); setToken(''); setNueva(''); setConfirma(''); setError(''); };

    return (
        <DemoShell huId="HU003" titulo="Recuperar Contraseña" integrante="Stefani" color="#7C3AED">

            <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
                {(['email','enviado','nueva','exito'] as Paso[]).map((p, i) => (
                    <div key={p} style={{ flex: 1, height: '4px', borderRadius: '4px', backgroundColor: ['email','enviado','nueva','exito'].indexOf(paso) >= i ? '#7C3AED' : '#E5E7EB' }} />
                ))}
            </div>

            {/* PASO 1 — Ingresar email */}
            {paso === 'email' && (
                <Card>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{ fontSize: '48px' }}>🔑</div>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '8px 0 4px 0' }}>¿Olvidaste tu contraseña?</h2>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Ingresa tu correo y te enviamos un enlace</p>
                    </div>
                    <form onSubmit={handleEmail}>
                        <FormField label="Correo electrónico registrado">
                            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.cl" required />
                        </FormField>
                        {error && <ErrorMessage mensaje={error} />}
                        <button type="submit" style={btnStyle('#7C3AED')} disabled={cargando}>
                            {cargando ? 'Enviando…' : 'Enviar enlace →'}
                        </button>
                    </form>
                </Card>
            )}

            {/* PASO 2 — Email enviado */}
            {paso === 'enviado' && (
                <Card>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📬</div>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>Enlace enviado</h2>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 16px 0' }}>
                            Revisa tu bandeja de entrada en <strong>{email}</strong>
                        </p>
                        <div style={{ backgroundColor: '#F5F3FF', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#7C3AED', textAlign: 'left' }}>
                            <p style={{ margin: '0 0 6px 0', fontWeight: '600' }}>📧 ¿Qué hacer?</p>
                            <p style={{ margin: 0, lineHeight: '1.6' }}>
                                1. Abre el email de CleanMap<br/>
                                2. Haz click en "Restablecer contraseña"<br/>
                                3. Serás redirigido aquí para crear tu nueva contraseña
                            </p>
                        </div>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0' }}>El enlace expira en 1 hora</p>
                        <button onClick={resetear} style={{ ...btnStyle('#F5F3FF'), color: '#7C3AED' }}>← Volver</button>
                    </div>
                </Card>
            )}

            {/* PASO 3 — Nueva contraseña (llegó desde el enlace del email) */}
            {paso === 'nueva' && (
                <Card>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>Nueva contraseña</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>Elige una contraseña segura para tu cuenta</p>
                    <form onSubmit={handleNueva}>
                        <FormField label="Nueva contraseña">
                            <input style={inputStyle} type="password" value={nueva} onChange={e => setNueva(e.target.value)} placeholder="Mínimo 8 caracteres" required />
                            {nueva && (
                                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    {[['≥ 8 caracteres', nueva.length >= 8], ['Una mayúscula', /[A-Z]/.test(nueva)], ['Un número', /\d/.test(nueva)]].map(([txt, ok]) => (
                                        <span key={txt as string} style={{ fontSize: '12px', color: ok ? '#16A34A' : '#94a3b8' }}>{ok ? '✓' : '○'} {txt as string}</span>
                                    ))}
                                </div>
                            )}
                        </FormField>
                        <FormField label="Confirmar contraseña">
                            <input style={{ ...inputStyle, borderColor: confirma && nueva !== confirma ? '#EF4444' : undefined }} type="password" value={confirma} onChange={e => setConfirma(e.target.value)} placeholder="Repite la contraseña" required />
                        </FormField>
                        {error && <ErrorMessage mensaje={error} />}
                        <button type="submit" style={btnStyle('#7C3AED')} disabled={cargando || !PASSWORD_RE.test(nueva)}>
                            {cargando ? 'Guardando…' : 'Restablecer contraseña →'}
                        </button>
                    </form>
                </Card>
            )}

            {/* PASO 4 — Éxito */}
            {paso === 'exito' && (
                <Card>
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ fontSize: '64px', marginBottom: '12px' }}>🔓</div>
                        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>¡Contraseña actualizada!</h2>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px 0' }}>Ya puedes iniciar sesión con tu nueva contraseña</p>
                        <SuccessMessage mensaje="Contraseña restablecida" />
                        <button onClick={resetear} style={{ ...btnStyle('#7C3AED'), marginTop: '20px' }}>Probar de nuevo</button>
                    </div>
                </Card>
            )}
        </DemoShell>
    );
}
