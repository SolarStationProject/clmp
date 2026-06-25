import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL || '';

type Paso = 'email' | 'enviado' | 'nueva' | 'exito';
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const PASOS: Paso[] = ['email', 'enviado', 'nueva', 'exito'];

export default function RecuperarScreen() {
    const navigate        = useNavigate();
    const [searchParams]  = useSearchParams();

    const [paso,      setPaso]      = useState<Paso>('email');
    const [email,     setEmail]     = useState('');
    const [token,     setToken]     = useState('');
    const [nueva,     setNueva]     = useState('');
    const [confirma,  setConfirma]  = useState('');
    const [cargando,  setCargando]  = useState(false);
    const [error,     setError]     = useState('');

    // Si el usuario llega desde el enlace del email con ?token=xxx
    useEffect(() => {
        const t = searchParams.get('token');
        if (t) { setToken(t); setPaso('nueva'); }
    }, []);

    const handleEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setCargando(true);
        try {
            const res  = await fetch(`${API_URL}/api/auth/recover`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Error al solicitar recuperación.'); return; }
            setPaso('enviado');
        } catch {
            setError('No se pudo conectar con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    const handleNueva = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!PASSWORD_RE.test(nueva)) { setError('Mínimo 8 caracteres, una mayúscula y un número.'); return; }
        if (nueva !== confirma)        { setError('Las contraseñas no coinciden.'); return; }
        setCargando(true);
        try {
            const res  = await fetch(`${API_URL}/api/auth/reset`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, nuevaPassword: nueva }),
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

    const inp: React.CSSProperties = {
        width: '100%', padding: '14px 16px', borderRadius: '12px',
        border: '1.5px solid #E2E8F0', fontSize: '15px', outline: 'none',
        boxSizing: 'border-box', color: '#1e293b', backgroundColor: '#fff',
        fontFamily: 'inherit',
    };
    const btn = (bg = '#005c2e'): React.CSSProperties => ({
        width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
        backgroundColor: cargando ? '#94A3B8' : bg, color: bg === '#F5F3FF' ? '#7C3AED' : '#fff',
        fontSize: '16px', fontWeight: '700', cursor: cargando ? 'default' : 'pointer',
        marginTop: '8px', fontFamily: 'inherit',
    });

    const pasoIdx = PASOS.indexOf(paso);

    return (
        <div style={{ minHeight: '100dvh', backgroundColor: '#f0fdf4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ fontSize: '48px', marginBottom: '6px' }}>🔑</div>
                <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#005c2e', margin: 0 }}>Recuperar contraseña</h1>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '6px 0 0 0' }}>CleanMap</p>
            </div>

            {/* Barra de progreso */}
            <div style={{ display: 'flex', gap: '6px', width: '100%', maxWidth: '360px', marginBottom: '24px' }}>
                {PASOS.map((_, i) => (
                    <div key={i} style={{ flex: 1, height: '4px', borderRadius: '4px', backgroundColor: pasoIdx >= i ? '#005c2e' : '#E2E8F0', transition: 'background-color 0.3s' }} />
                ))}
            </div>

            <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {/* Paso 1 — Ingresar email */}
                {paso === 'email' && (
                    <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <p style={{ fontSize: '14px', color: '#475569', margin: 0, textAlign: 'center' }}>
                            Ingresa tu correo y te enviamos un enlace para restablecer tu contraseña.
                        </p>
                        <input style={inp} type="email" placeholder="tu@correo.cl" value={email}
                            onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                        {error && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#DC2626' }}>{error}</div>}
                        <button type="submit" style={btn()} disabled={cargando}>
                            {cargando ? '⏳ Enviando…' : 'Enviar enlace →'}
                        </button>
                        <button type="button" onClick={() => navigate('/login')} style={{ ...btn('#F1F5F9'), color: '#64748B', marginTop: 0 }}>
                            ← Volver al login
                        </button>
                    </form>
                )}

                {/* Paso 2 — Email enviado */}
                {paso === 'enviado' && (
                    <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                        <div style={{ fontSize: '52px', marginBottom: '12px' }}>📬</div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>Enlace enviado</h2>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 16px 0' }}>
                            Revisa tu bandeja de entrada en <strong>{email}</strong>
                        </p>
                        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '14px', marginBottom: '16px', textAlign: 'left' }}>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#15803D', margin: '0 0 6px 0' }}>¿Qué hacer?</p>
                            <p style={{ fontSize: '13px', color: '#166534', margin: 0, lineHeight: 1.7 }}>
                                1. Abre el email de CleanMap<br/>
                                2. Haz clic en "Restablecer contraseña"<br/>
                                3. Vuelves aquí para elegir tu nueva contraseña
                            </p>
                        </div>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0' }}>El enlace expira en 1 hora</p>
                        <button onClick={() => { setPaso('email'); setEmail(''); setError(''); }} style={btn('#F1F5F9')}>
                            ← Volver
                        </button>
                    </div>
                )}

                {/* Paso 3 — Nueva contraseña */}
                {paso === 'nueva' && (
                    <form onSubmit={handleNueva} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <p style={{ fontSize: '14px', color: '#475569', margin: 0, textAlign: 'center' }}>
                            Elige una contraseña segura para tu cuenta.
                        </p>
                        <div>
                            <input style={inp} type="password" placeholder="Nueva contraseña" value={nueva}
                                onChange={e => setNueva(e.target.value)} required autoComplete="new-password" />
                            {nueva && (
                                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    {([['≥ 8 caracteres', nueva.length >= 8], ['Una mayúscula', /[A-Z]/.test(nueva)], ['Un número', /\d/.test(nueva)]] as [string, boolean][]).map(([txt, ok]) => (
                                        <span key={txt} style={{ fontSize: '12px', color: ok ? '#16A34A' : '#94A3B8' }}>{ok ? '✓' : '○'} {txt}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <input style={{ ...inp, borderColor: confirma && nueva !== confirma ? '#EF4444' : '#E2E8F0' }}
                            type="password" placeholder="Confirmar contraseña" value={confirma}
                            onChange={e => setConfirma(e.target.value)} required autoComplete="new-password" />
                        {error && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#DC2626' }}>{error}</div>}
                        <button type="submit" style={btn()} disabled={cargando || !PASSWORD_RE.test(nueva)}>
                            {cargando ? '⏳ Guardando…' : 'Restablecer contraseña →'}
                        </button>
                    </form>
                )}

                {/* Paso 4 — Éxito */}
                {paso === 'exito' && (
                    <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '32px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                        <div style={{ fontSize: '64px', marginBottom: '12px' }}>🔓</div>
                        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>¡Contraseña actualizada!</h2>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px 0' }}>Ya puedes iniciar sesión con tu nueva contraseña.</p>
                        <div style={{ backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px', marginBottom: '20px' }}>
                            <p style={{ fontSize: '14px', fontWeight: '700', color: '#15803D', margin: 0 }}>✅ Contraseña restablecida</p>
                        </div>
                        <button onClick={() => navigate('/login')} style={btn()}>
                            Ir al login →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
