import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
const API_URL = import.meta.env.VITE_API_URL || '';
const PLATAFORMA = Capacitor.isNativePlatform() ? 'movil' : 'web';

export default function LoginScreen() {
    const navigate = useNavigate();
    const [email,     setEmail]     = useState('');
    const [password,  setPassword]  = useState('');
    const [cargando,  setCargando]  = useState(false);
    const [error,     setError]     = useState('');
    const [modo,      setModo]      = useState<'login' | 'registro'>('login');

    // Registro
    const [nombre,    setNombre]    = useState('');
    const [confirm,   setConfirm]   = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setCargando(true);
        setError('');
        try {
            const res  = await fetch(`${API_URL}/api/auth/login`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email, password, plataforma: PLATAFORMA }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || data.message || 'Credenciales incorrectas.'); return; }

            localStorage.setItem('cleanmap_token',  data.token);
            localStorage.setItem('cleanmap_uid',    data.usuario.id);
            localStorage.setItem('cleanmap_rol',    data.usuario.rol);
            localStorage.setItem('cleanmap_nombre', data.usuario.nombre);

            if (data.usuario.rol === 'Administrador') {
                navigate('/admin', { replace: true });
            } else {
                navigate('/app/mapa', { replace: true });
            }
        } catch {
            setError('No se pudo conectar con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    const [paso,       setPaso]       = useState<'form' | 'verificar'>('form');
    const [codigo,     setCodigo]     = useState('');

    const handleRegistro = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
        const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!PASSWORD_RE.test(password)) { setError('Mínimo 8 caracteres, una mayúscula y un número.'); return; }
        setCargando(true);
        setError('');
        try {
            const res  = await fetch(`${API_URL}/api/auth/register`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ nombre, email, password }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Error al registrarse.'); return; }
            setPaso('verificar');
        } catch {
            setError('No se pudo conectar con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    const handleVerificar = async (e: React.FormEvent) => {
        e.preventDefault();
        setCargando(true);
        setError('');
        try {
            const res  = await fetch(`${API_URL}/api/auth/verify-email`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email, codigo }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Código incorrecto.'); return; }
            setModo('login');
            setPaso('form');
            setPassword('');
            setCodigo('');
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
    const btn: React.CSSProperties = {
        width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
        backgroundColor: cargando ? '#94A3B8' : '#005c2e', color: '#fff',
        fontSize: '16px', fontWeight: '700', cursor: cargando ? 'default' : 'pointer',
        marginTop: '8px', fontFamily: 'inherit',
    };

    return (
        <div style={{ minHeight: '100dvh', backgroundColor: '#f0fdf4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ fontSize: '56px', marginBottom: '8px' }}>🗺️</div>
                <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#005c2e', margin: 0, letterSpacing: '-0.5px' }}>CleanMap</h1>
                <p style={{ fontSize: '14px', color: '#64748B', margin: '6px 0 0 0' }}>Reporta microbasurales en tu comuna</p>
            </div>

            {/* Toggle */}
            <div style={{ display: 'flex', backgroundColor: '#E2E8F0', borderRadius: '12px', padding: '4px', marginBottom: '24px', width: '100%', maxWidth: '360px' }}>
                {(['login', 'registro'] as const).map(m => (
                    <button key={m} onClick={() => { setModo(m); setError(''); }} style={{
                        flex: 1, padding: '10px', borderRadius: '9px', border: 'none',
                        backgroundColor: modo === m ? '#fff' : 'transparent',
                        color: modo === m ? '#005c2e' : '#64748B',
                        fontWeight: modo === m ? '700' : '400', fontSize: '14px',
                        cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                        boxShadow: modo === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}>
                        {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                    </button>
                ))}
            </div>

            {/* Formulario */}
            {modo === 'registro' && paso === 'verificar' ? (
                <form onSubmit={handleVerificar}
                    style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#1D4ED8' }}>
                        📬 Revisa tu email <strong>{email}</strong> — te enviamos un código de verificación.
                    </div>
                    <input style={inp} type="text" placeholder="Código de verificación" value={codigo}
                        onChange={e => setCodigo(e.target.value)} required />
                    {error && (
                        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#DC2626' }}>{error}</div>
                    )}
                    <button type="submit" style={btn} disabled={cargando}>
                        {cargando ? '⏳ Verificando…' : '✅ Verificar cuenta'}
                    </button>
                </form>
            ) : (
                <form onSubmit={modo === 'login' ? handleLogin : handleRegistro}
                    style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {modo === 'registro' && (
                        <input style={inp} type="text" placeholder="Nombre completo" value={nombre}
                            onChange={e => setNombre(e.target.value)} required />
                    )}

                    <input style={inp} type="email" placeholder="Correo electrónico" value={email}
                        onChange={e => setEmail(e.target.value)} required autoComplete="email" />

                    <input style={inp} type="password" placeholder="Contraseña" value={password}
                        onChange={e => setPassword(e.target.value)} required autoComplete={modo === 'login' ? 'current-password' : 'new-password'} />

                    {modo === 'registro' && (
                        <input style={inp} type="password" placeholder="Confirmar contraseña" value={confirm}
                            onChange={e => setConfirm(e.target.value)} required />
                    )}

                    {error && (
                        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#DC2626' }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" style={btn} disabled={cargando}>
                        {cargando ? '⏳ Cargando…' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
                    </button>

                    {modo === 'login' && (
                        <button type="button" onClick={() => navigate('/recuperar')}
                            style={{ background: 'none', border: 'none', color: '#005c2e', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: '4px 0', textDecoration: 'underline', fontFamily: 'inherit' }}>
                            ¿Olvidaste tu contraseña?
                        </button>
                    )}
                </form>
            )}
        </div>
    );
}
