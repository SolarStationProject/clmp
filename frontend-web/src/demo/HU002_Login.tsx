// HU002 — Iniciar sesión (llamadas reales al backend)
// Guarda JWT en localStorage para que todas las HUs lo usen
// Resultado esperado: "Acceso correcto al sistema"
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DemoShell, { SuccessMessage, ErrorMessage, FormField, inputStyle, btnStyle, Card } from './DemoShell';
import { getSession, clearSession } from './useSession';
import { detectarPlataforma, labelPlataforma } from './usePlataforma';

export default function HU002_Login() {
    const navigate  = useNavigate();
    const location  = useLocation();
    const state     = location.state as { from?: string; rolRequerido?: string } | null;

    const plataformaDetectada = detectarPlataforma();

    const [email,      setEmail]      = useState('');
    const [password,   setPassword]   = useState('');
    const [plataforma, setPlataforma] = useState<'web' | 'movil'>(plataformaDetectada);
    const [cargando,   setCargando]   = useState(false);
    const [error,      setError]      = useState('');
    const [showPass,   setShowPass]   = useState(false);
    const [usuarioOk,  setUsuarioOk]  = useState<{ nombre: string; rol: string; email: string } | null>(null);

    // Si ya hay sesión activa, mostrarla
    useEffect(() => {
        const s = getSession();
        if (s) setUsuarioOk({ nombre: s.nombre, rol: s.rol, email: '' });
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCargando(true);
        try {
            const res  = await fetch('/api/auth/login', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email, password, plataforma }),
            });
            const data = await res.json();

            if (!res.ok) { setError(data.error || 'Error al iniciar sesión.'); return; }

            localStorage.setItem('cleanmap_token',  data.token);
            localStorage.setItem('cleanmap_uid',    data.usuario.id);
            localStorage.setItem('cleanmap_rol',    data.usuario.rol);
            localStorage.setItem('cleanmap_nombre', data.usuario.nombre);

            setUsuarioOk({ nombre: data.usuario.nombre, rol: data.usuario.rol, email });

            // Si venía redirigido desde otra HU, volver ahí
            if (state?.from) setTimeout(() => navigate(state.from!), 1200);
        } catch {
            setError('No se pudo conectar con el servidor. ¿Está corriendo el backend?');
        } finally {
            setCargando(false);
        }
    };

    const cerrarSesion = () => {
        clearSession();
        setUsuarioOk(null);
        setEmail(''); setPassword(''); setError('');
    };

    return (
        <DemoShell huId="HU002" titulo="Iniciar Sesión" integrante="Stefani" color="#7C3AED">
            <Card>
                {/* Aviso si fue redirigido */}
                {state?.rolRequerido && !usuarioOk && (
                    <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#92400E' }}>
                        ⚠️ Necesitas iniciar sesión como <strong>{state.rolRequerido}</strong> para acceder a esa pantalla.
                    </div>
                )}
                {state?.from && !state?.rolRequerido && !usuarioOk && (
                    <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#1D4ED8' }}>
                        🔒 Inicia sesión para continuar.
                    </div>
                )}

                {usuarioOk ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', margin: '12px 0' }}>✅</div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px 0' }}>Sesión iniciada</h2>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 16px 0' }}>
                            Bienvenido/a, <strong>{usuarioOk.nombre}</strong>
                        </p>
                        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px', marginBottom: '20px', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                                <span style={{ color: '#64748b' }}>👤 Rol</span>
                                <span style={{ fontWeight: '700', color: '#1e293b' }}>{usuarioOk.rol}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                                <span style={{ color: '#64748b' }}>🔑 JWT</span>
                                <span style={{ fontWeight: '600', color: '#16A34A' }}>Guardado en localStorage ✓</span>
                            </div>
                        </div>
                        {usuarioOk.email && (
                            <div style={{ backgroundColor: '#EFF6FF', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#2563EB', textAlign: 'left' }}>
                                📬 Revisa tu email — enviamos confirmación de inicio de sesión
                            </div>
                        )}
                        <SuccessMessage mensaje="Acceso correcto al sistema" />
                        <button onClick={cerrarSesion} style={{ ...btnStyle('#64748b'), marginTop: '16px' }}>
                            Cerrar sesión
                        </button>
                    </div>
                ) : (
                    <>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>Acceso al sistema</h2>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>Ingresa tus credenciales</p>
                        <form onSubmit={handleLogin}>
                            <FormField label="Correo electrónico">
                                <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.cl" required />
                            </FormField>
                            <FormField label="Contraseña">
                                <div style={{ position: 'relative' }}>
                                    <input style={{ ...inputStyle, paddingRight: '44px' }} type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Tu contraseña" required />
                                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                                        {showPass ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </FormField>
                            <FormField label="Plataforma">
                                {/* Badge de detección automática */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', padding: '6px 12px' }}>
                                    <span style={{ fontSize: '12px', color: '#15803D', fontWeight: '600' }}>
                                        Detectado automáticamente: {labelPlataforma(plataformaDetectada)}
                                    </span>
                                </div>
                                {/* Override manual */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {(['web', 'movil'] as const).map(p => (
                                        <button key={p} type="button" onClick={() => setPlataforma(p)}
                                            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `2px solid ${plataforma === p ? '#7C3AED' : '#E5E7EB'}`, backgroundColor: plataforma === p ? '#F5F3FF' : '#fff', color: plataforma === p ? '#7C3AED' : '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '14px', position: 'relative' }}>
                                            {p === 'web' ? '🖥️ Web' : '📱 Móvil'}
                                            {p === plataformaDetectada && (
                                                <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#22C55E', color: '#fff', fontSize: '9px', fontWeight: '800', padding: '1px 5px', borderRadius: '6px' }}>AUTO</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '6px 0 0 0' }}>Puedes cambiarlo manualmente para simular el escenario de HU007</p>
                            </FormField>
                            {error && <ErrorMessage mensaje={error} />}
                            <button type="submit" style={btnStyle('#7C3AED')} disabled={cargando}>
                                {cargando ? 'Iniciando sesión…' : 'Ingresar →'}
                            </button>
                        </form>
                    </>
                )}
            </Card>
        </DemoShell>
    );
}
