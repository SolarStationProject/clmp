// HU007 — Control de acceso por plataforma y rol
// Criterios: admin solo web, ciudadano solo móvil, errores específicos
// Resultado esperado: "Acceso restringido por plataforma y rol"
import React, { useState } from 'react';
import DemoShell, { SuccessMessage, ErrorMessage, Card } from './DemoShell';
import { detectarPlataforma, labelPlataforma } from './usePlataforma';
import { getSession } from './useSession';

type Rol = 'Administrador' | 'Ciudadano';
type Plataforma = 'web' | 'movil';
type Estado = null | 'permitido' | 'bloqueado_admin' | 'bloqueado_ciudadano';

const ESCENARIOS = [
    { rol: 'Administrador' as Rol, plataforma: 'web'   as Plataforma, esperado: 'permitido'           as Estado, label: 'Admin en Web',      emoji: '✅', desc: 'Acceso permitido — Dashboard administrativo' },
    { rol: 'Administrador' as Rol, plataforma: 'movil' as Plataforma, esperado: 'bloqueado_admin'     as Estado, label: 'Admin en Móvil',    emoji: '❌', desc: 'Bloqueado — Solo acceso desde web' },
    { rol: 'Ciudadano'     as Rol, plataforma: 'movil' as Plataforma, esperado: 'permitido'           as Estado, label: 'Ciudadano en Móvil', emoji: '✅', desc: 'Acceso permitido — App de reportes' },
    { rol: 'Ciudadano'     as Rol, plataforma: 'web'   as Plataforma, esperado: 'bloqueado_ciudadano' as Estado, label: 'Ciudadano en Web',   emoji: '⚠️', desc: 'Redirigido — Descargar app móvil' },
];

export default function HU007_ControlAcceso() {
    const plataformaDetectada = detectarPlataforma();
    const sesion = getSession();

    const [rol,         setRol]         = useState<Rol>(sesion?.rol ?? 'Administrador');
    const [plataforma,  setPlataforma]  = useState<Plataforma>(plataformaDetectada);
    const [resultado,   setResultado]   = useState<Estado>(null);
    const [mostrarExito,setMostrarExito]= useState(false);

    const evaluar = () => {
        if (rol === 'Administrador' && plataforma === 'movil') setResultado('bloqueado_admin');
        else if (rol === 'Ciudadano' && plataforma === 'web')  setResultado('bloqueado_ciudadano');
        else                                                    setResultado('permitido');
        setMostrarExito(true);
    };

    const getMensaje = () => {
        if (resultado === 'bloqueado_admin')     return 'Los administradores solo pueden gestionar el sistema desde la plataforma web.';
        if (resultado === 'bloqueado_ciudadano') return 'Para reportar incidentes, descarga nuestra aplicación móvil.';
        return '';
    };

    return (
        <DemoShell huId="HU007" titulo="Control de Acceso por Plataforma" integrante="Alex" color="#DC2626">

            {/* Banner de detección en tiempo real */}
            <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>Detección automática de este dispositivo</p>
                    <p style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0 }}>
                        {labelPlataforma(plataformaDetectada)}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {sesion ? (
                        <>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>Sesión activa</p>
                            <p style={{ fontSize: '16px', fontWeight: '700', color: plataformaDetectada === 'web' && sesion.rol === 'Administrador' ? '#86EFAC' : plataformaDetectada === 'movil' && sesion.rol === 'Ciudadano' ? '#86EFAC' : '#FCA5A5', margin: 0 }}>
                                {sesion.rol === 'Administrador' ? '👔' : '👤'} {sesion.rol}
                                {' '}
                                {plataformaDetectada === 'web' && sesion.rol === 'Administrador' ? '✅' :
                                 plataformaDetectada === 'movil' && sesion.rol === 'Ciudadano' ? '✅' : '❌'}
                            </p>
                        </>
                    ) : (
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Sin sesión activa</p>
                    )}
                </div>
            </div>

            {/* Reglas del sistema */}
            <Card>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '0 0 12px 0' }}>📋 Reglas de acceso</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {ESCENARIOS.map((esc, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                            <span style={{ fontSize: '18px', flexShrink: 0 }}>{esc.emoji}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: '6px', marginBottom: '2px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '1px 8px', borderRadius: '6px', backgroundColor: esc.rol === 'Administrador' ? '#FEF2F2' : '#EFF6FF', color: esc.rol === 'Administrador' ? '#DC2626' : '#2563EB' }}>{esc.rol}</span>
                                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '1px 8px', borderRadius: '6px', backgroundColor: '#F5F5F5', color: '#374151' }}>{esc.plataforma === 'web' ? '🖥️ Web' : '📱 Móvil'}</span>
                                </div>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{esc.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Simulador */}
            <Card>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '0 0 16px 0' }}>🧪 Simula un intento de acceso</h3>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Rol del usuario</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {(['Administrador', 'Ciudadano'] as Rol[]).map(r => (
                            <button key={r} onClick={() => { setRol(r); setResultado(null); setMostrarExito(false); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `2px solid ${rol === r ? '#DC2626' : '#E5E7EB'}`, backgroundColor: rol === r ? '#FEF2F2' : '#fff', color: rol === r ? '#DC2626' : '#374151', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                                {r === 'Administrador' ? '👔 Admin' : '👤 Ciudadano'}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>Plataforma de acceso</label>
                    <div style={{ fontSize: '11px', color: '#16A34A', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '7px', padding: '4px 10px', marginBottom: '8px', display: 'inline-block' }}>
                        Auto-detectada: {labelPlataforma(plataformaDetectada)}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {(['web', 'movil'] as Plataforma[]).map(p => (
                            <button key={p} onClick={() => { setPlataforma(p); setResultado(null); setMostrarExito(false); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `2px solid ${plataforma === p ? '#DC2626' : '#E5E7EB'}`, backgroundColor: plataforma === p ? '#FEF2F2' : '#fff', color: plataforma === p ? '#DC2626' : '#374151', fontWeight: '700', cursor: 'pointer', fontSize: '14px', position: 'relative' }}>
                                {p === 'web' ? '🖥️ Web' : '📱 Móvil'}
                                {p === plataformaDetectada && <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#22C55E', color: '#fff', fontSize: '9px', fontWeight: '800', padding: '1px 5px', borderRadius: '6px' }}>AUTO</span>}
                            </button>
                        ))}
                    </div>
                </div>

                <button onClick={evaluar} style={{ width: '100%', padding: '12px', backgroundColor: '#DC2626', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                    Intentar acceso →
                </button>

                {resultado === 'permitido' && (
                    <div style={{ backgroundColor: '#F0FDF4', borderRadius: '12px', padding: '16px', marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '32px' }}>✅</span>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: '700', color: '#15803D', margin: '0 0 4px 0' }}>Acceso concedido</p>
                            <p style={{ fontSize: '12px', color: '#16A34A', margin: 0 }}>
                                {rol === 'Administrador' ? 'Redirigiendo al dashboard administrativo…' : 'Redirigiendo a la app de reportes…'}
                            </p>
                        </div>
                    </div>
                )}

                {(resultado === 'bloqueado_admin' || resultado === 'bloqueado_ciudadano') && (
                    <ErrorMessage mensaje={getMensaje()} />
                )}

                {mostrarExito && resultado && (
                    <SuccessMessage mensaje="Acceso restringido por plataforma y rol" />
                )}
            </Card>
        </DemoShell>
    );
}
