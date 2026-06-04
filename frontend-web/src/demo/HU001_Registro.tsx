// HU001 — Registro de usuarios (llamadas reales al backend)
// Resultado esperado: "Cuenta creada exitosamente"
import React, { useState } from 'react';
import DemoShell, { SuccessMessage, ErrorMessage, FormField, inputStyle, btnStyle, Card } from './DemoShell';

type Paso = 'formulario' | 'verificacion' | 'exito';
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function HU001_Registro() {
    const [paso,      setPaso]      = useState<Paso>('formulario');
    const [nombre,    setNombre]    = useState('');
    const [email,     setEmail]     = useState('');
    const [password,  setPassword]  = useState('');
    const [confirm,   setConfirm]   = useState('');
    const [codigo,    setCodigo]    = useState('');
    const [error,     setError]     = useState('');
    const [cargando,  setCargando]  = useState(false);
    const [showPass,  setShowPass]  = useState(false);

    const handleRegistrar = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!PASSWORD_RE.test(password)) {
            setError('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.');
            return;
        }
        if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }

        setCargando(true);
        try {
            const res  = await fetch('/api/auth/register', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ nombre, email, password }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Error al registrar.'); return; }
            setPaso('verificacion');
        } catch {
            setError('No se pudo conectar con el servidor. ¿Está corriendo el backend?');
        } finally {
            setCargando(false);
        }
    };

    const handleVerificar = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCargando(true);
        try {
            const res  = await fetch('/api/auth/verify-email', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email, codigo }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Código incorrecto.'); return; }
            setPaso('exito');
        } catch {
            setError('No se pudo conectar con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    const resetear = () => {
        setPaso('formulario'); setNombre(''); setEmail(''); setPassword('');
        setConfirm(''); setCodigo(''); setError('');
    };

    return (
        <DemoShell huId="HU001" titulo="Registro de Usuarios" integrante="Stefani" color="#7C3AED">

            {/* Indicador de pasos */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {(['formulario', 'verificacion', 'exito'] as Paso[]).map((p, i) => (
                    <div key={p} style={{ flex: 1, height: '4px', borderRadius: '4px', backgroundColor: ['formulario','verificacion','exito'].indexOf(paso) >= i ? '#7C3AED' : '#E5E7EB' }} />
                ))}
            </div>

            {/* PASO 1 — Formulario */}
            {paso === 'formulario' && (
                <Card>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>Crear cuenta</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>Completa el formulario — recibirás un código por email</p>
                    <form onSubmit={handleRegistrar}>
                        <FormField label="Nombre completo">
                            <input style={inputStyle} type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="María González" required />
                        </FormField>
                        <FormField label="Correo electrónico">
                            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.cl" required />
                        </FormField>
                        <FormField label="Contraseña">
                            <div style={{ position: 'relative' }}>
                                <input style={{ ...inputStyle, paddingRight: '44px' }} type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required />
                                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                                    {showPass ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {password && (
                                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    {[['≥ 8 caracteres', password.length >= 8], ['Una mayúscula', /[A-Z]/.test(password)], ['Un número', /\d/.test(password)]].map(([txt, ok]) => (
                                        <span key={txt as string} style={{ fontSize: '12px', color: ok ? '#16A34A' : '#94a3b8' }}>{ok ? '✓' : '○'} {txt as string}</span>
                                    ))}
                                </div>
                            )}
                        </FormField>
                        <FormField label="Confirmar contraseña">
                            <input style={{ ...inputStyle, borderColor: confirm && password !== confirm ? '#EF4444' : undefined }} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repite la contraseña" required />
                        </FormField>
                        {error && <ErrorMessage mensaje={error} />}
                        <button type="submit" style={btnStyle('#7C3AED')} disabled={cargando}>
                            {cargando ? 'Enviando…' : 'Crear cuenta →'}
                        </button>
                    </form>
                </Card>
            )}

            {/* PASO 2 — Verificación */}
            {paso === 'verificacion' && (
                <Card>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📧</div>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>Revisa tu correo</h2>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                            Enviamos un código de 6 dígitos a <strong>{email}</strong>
                        </p>
                    </div>
                    <form onSubmit={handleVerificar}>
                        <FormField label="Código de verificación">
                            <input
                                style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.3em', fontSize: '22px', fontWeight: '700' }}
                                type="text"
                                maxLength={6}
                                value={codigo}
                                onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                required
                            />
                        </FormField>
                        {error && <ErrorMessage mensaje={error} />}
                        <button type="submit" style={btnStyle('#7C3AED')} disabled={cargando || codigo.length < 6}>
                            {cargando ? 'Verificando…' : 'Verificar código →'}
                        </button>
                        <button type="button" onClick={() => setPaso('formulario')} style={{ ...btnStyle('#F5F3FF'), color: '#7C3AED', marginTop: '8px' }}>
                            ← Volver
                        </button>
                    </form>
                </Card>
            )}

            {/* PASO 3 — Éxito */}
            {paso === 'exito' && (
                <Card>
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
                        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>¡Registro completo!</h2>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px 0' }}>Bienvenido/a, <strong>{nombre}</strong></p>
                        <SuccessMessage mensaje="Cuenta creada exitosamente" />
                        <button onClick={resetear} style={{ ...btnStyle('#7C3AED'), marginTop: '20px' }}>
                            Probar de nuevo
                        </button>
                    </div>
                </Card>
            )}
        </DemoShell>
    );
}
