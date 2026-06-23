import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSession, clearSession, API_BASE } from './useSession';

interface Props {
    huId:       string;
    titulo:     string;
    integrante: string;
    color:      string;
    children:   React.ReactNode;
}

const COLORES: Record<string, string> = {
    Stefani: '#7C3AED', Alex: '#DC2626', Julián: '#D97706',
    William: '#059669', Martín: '#6D28D9', Jaime: '#0EA5E9',
};

const NAV_ITEMS = [
    { id: 'HU001', ruta: '/demo/hu001', integrante: 'Stefani' },
    { id: 'HU002', ruta: '/demo/hu002', integrante: 'Stefani' },
    { id: 'HU003', ruta: '/demo/hu003', integrante: 'Stefani' },
    { id: 'HU004', ruta: '/demo/hu004', integrante: 'Jaime'   },
    { id: 'HU005', ruta: '/demo/hu005', integrante: 'William' },
    { id: 'HU006', ruta: '/demo/hu006', integrante: 'Alex'    },
    { id: 'HU007', ruta: '/demo/hu007', integrante: 'Alex'    },
    { id: 'HU009', ruta: '/demo/hu009', integrante: 'Jaime'   },
    { id: 'HU010', ruta: '/demo/hu010', integrante: 'Julián'  },
    { id: 'HU012', ruta: '/demo/hu012', integrante: 'Jaime'   },
    { id: 'HU016', ruta: '/demo/hu016', integrante: 'Alex'    },
    { id: 'HU018', ruta: '/demo/hu018', integrante: 'Martín'  },
    { id: 'HU019', ruta: '/demo/hu019', integrante: 'Julián'  },
    { id: 'HU020', ruta: '/demo/hu020', integrante: 'Julián'  },
    { id: 'HU021', ruta: '/demo/hu021', integrante: 'Julián'  },
    { id: 'HU022', ruta: '/demo/hu022', integrante: 'Jaime'   },
    { id: 'HU023', ruta: '/demo/hu023', integrante: 'Julián'  },
];

// Altura fija de la barra nav para que el contenido no quede tapado
const NAV_HEIGHT  = 44;
const HEAD_HEIGHT = 52;
const TOTAL_OFFSET = NAV_HEIGHT + HEAD_HEIGHT;

export default function DemoShell({ huId, titulo, integrante, color, children }: Props) {
    const navigate  = useNavigate();
    const location  = useLocation();
    const c = COLORES[integrante] || color;

    const currentIdx = NAV_ITEMS.findIndex(n => n.ruta === location.pathname);
    const prev    = currentIdx > 0                   ? NAV_ITEMS[currentIdx - 1] : null;
    const next    = currentIdx < NAV_ITEMS.length - 1 ? NAV_ITEMS[currentIdx + 1] : null;
    const sesion  = getSession();

    const handleLogout = () => {
        clearSession();
        navigate('/demo/hu002', { replace: true });
    };

    const [resetting,  setResetting]  = useState(false);
    const [resetDone,  setResetDone]  = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);

    const handleReset = async () => {
        if (!sesion) return;
        setResetting(true);
        setConfirmReset(false);
        try {
            const res = await fetch(`${API_BASE}/api/admin/reset-db`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${sesion.token}` },
            });
            if (res.ok) { setResetDone(true); setTimeout(() => setResetDone(false), 3000); }
        } catch { /* silencioso */ }
        finally { setResetting(false); }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* ── Barra de navegación fija ───────────────────────────────── */}
            <div style={{
                position:        'fixed',
                top:             0,
                left:            0,
                right:           0,
                height:          `${NAV_HEIGHT}px`,
                backgroundColor: '#1e293b',
                zIndex:          200,
                display:         'flex',
                alignItems:      'center',
                gap:             '4px',
                padding:         '0 10px',
                overflowX:       'auto',
                scrollbarWidth:  'none',
                boxShadow:       '0 2px 8px rgba(0,0,0,0.25)',
            }}>
                {/* Logo CleanMap — click lleva al índice de HUs */}
                <span onClick={() => navigate('/demo')} style={{ fontSize: '15px', fontWeight: '800', color: '#22c55e', marginRight: '8px', flexShrink: 0, letterSpacing: '-0.3px', cursor: 'pointer' }}>
                    🗺️ CM
                </span>

                {NAV_ITEMS.map(item => {
                    const isActive = item.ruta === location.pathname;
                    const btnColor = COLORES[item.integrante] || '#64748b';
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.ruta)}
                            title={item.integrante}
                            style={{
                                padding:         '5px 10px',
                                borderRadius:    '7px',
                                border:          'none',
                                fontSize:        '12px',
                                fontWeight:      '700',
                                cursor:          'pointer',
                                flexShrink:      0,
                                whiteSpace:      'nowrap',
                                transition:      'background 0.12s',
                                backgroundColor: isActive ? btnColor : 'rgba(255,255,255,0.08)',
                                color:           isActive ? '#fff'    : 'rgba(255,255,255,0.6)',
                                outline:         isActive ? `2px solid ${btnColor}` : 'none',
                                outlineOffset:   '1px',
                            }}
                        >
                            {item.id}
                        </button>
                    );
                })}

                {/* Separador + info de sesión + acciones */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.15)' }}>
                    {sesion ? (
                        <>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
                                {sesion.rol === 'Administrador' ? '👔' : '👤'} {sesion.nombre.split(' ')[0]}
                            </span>

                            {/* Reset DB — solo admin */}
                            {sesion.rol === 'Administrador' && (
                                confirmReset ? (
                                    <>
                                        <span style={{ fontSize: '11px', color: '#fca5a5', whiteSpace: 'nowrap' }}>¿Seguro?</span>
                                        <button onClick={handleReset} style={{ padding: '4px 8px', borderRadius: '7px', border: 'none', backgroundColor: 'rgba(239,68,68,0.5)', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                            {resetting ? '…' : 'Sí'}
                                        </button>
                                        <button onClick={() => setConfirmReset(false)} style={{ padding: '4px 8px', borderRadius: '7px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '11px', cursor: 'pointer' }}>No</button>
                                    </>
                                ) : resetDone ? (
                                    <span style={{ fontSize: '11px', color: '#86efac', whiteSpace: 'nowrap' }}>✓ BD reseteada</span>
                                ) : (
                                    <button onClick={() => setConfirmReset(true)} title="Reset BD" style={{ padding: '4px 8px', borderRadius: '7px', border: 'none', backgroundColor: 'rgba(249,115,22,0.2)', color: '#fdba74', fontSize: '11px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        🔄 Reset DB
                                    </button>
                                )
                            )}

                            <button onClick={handleLogout} title="Cerrar sesión" style={{ padding: '4px 10px', borderRadius: '7px', border: 'none', backgroundColor: 'rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                Salir
                            </button>
                        </>
                    ) : (
                        <button onClick={() => navigate('/demo/hu002')} style={{ padding: '4px 10px', borderRadius: '7px', border: 'none', backgroundColor: 'rgba(124,58,237,0.3)', color: '#c4b5fd', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            Iniciar sesión
                        </button>
                    )}
                </div>
            </div>

            {/* ── Header de la HU actual ─────────────────────────────────── */}
            <div style={{
                position:        'fixed',
                top:             `${NAV_HEIGHT}px`,
                left:            0,
                right:           0,
                height:          `${HEAD_HEIGHT}px`,
                backgroundColor: '#005c2e',
                zIndex:          199,
                display:         'flex',
                alignItems:      'center',
                padding:         '0 16px',
                gap:             '12px',
                boxShadow:       '0 1px 4px rgba(0,0,0,0.15)',
            }}>
                {/* Prev */}
                <button
                    onClick={() => prev && navigate(prev.ruta)}
                    disabled={!prev}
                    style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: '7px', padding: '5px 10px', cursor: prev ? 'pointer' : 'default', opacity: prev ? 1 : 0.3, fontSize: '13px', fontWeight: '700', flexShrink: 0 }}
                >
                    ‹
                </button>

                {/* HU info */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', backgroundColor: `${c}50`, color: '#fff', padding: '3px 10px', borderRadius: '7px', flexShrink: 0 }}>
                        {huId}
                    </span>
                    <h1 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {titulo}
                    </h1>
                </div>

                {/* Integrante */}
                <span style={{ fontSize: '12px', backgroundColor: `${c}60`, color: '#fff', padding: '4px 12px', borderRadius: '7px', fontWeight: '600', flexShrink: 0 }}>
                    {integrante}
                </span>

                {/* Next */}
                <button
                    onClick={() => next && navigate(next.ruta)}
                    disabled={!next}
                    style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: '7px', padding: '5px 10px', cursor: next ? 'pointer' : 'default', opacity: next ? 1 : 0.3, fontSize: '13px', fontWeight: '700', flexShrink: 0 }}
                >
                    ›
                </button>
            </div>

            {/* ── Contenido de la HU ────────────────────────────────────── */}
            <div style={{ paddingTop: `${TOTAL_OFFSET + 16}px`, maxWidth: '640px', margin: '0 auto', padding: `${TOTAL_OFFSET + 16}px 16px 32px` }}>
                {children}
            </div>
        </div>
    );
}

// ── Componentes auxiliares reutilizables ──────────────────────────────────────

export function SuccessMessage({ mensaje }: { mensaje: string }) {
    return (
        <div style={{ backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
            <span style={{ fontSize: '24px' }}>✅</span>
            <div>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#15803D', margin: 0 }}>Resultado esperado</p>
                <p style={{ fontSize: '15px', fontWeight: '800', color: '#166534', margin: '2px 0 0 0' }}>"{mensaje}"</p>
            </div>
        </div>
    );
}

export function ErrorMessage({ mensaje }: { mensaje: string }) {
    return (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
            <span style={{ fontSize: '24px' }}>❌</span>
            <p style={{ fontSize: '14px', color: '#DC2626', margin: 0, fontWeight: '600' }}>{mensaje}</p>
        </div>
    );
}

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>{label}</label>
            {children}
        </div>
    );
}

export const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #D1D5DB',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', backgroundColor: '#fff',
};

export const btnStyle = (color = '#005c2e'): React.CSSProperties => ({
    width: '100%', padding: '12px', backgroundColor: color, color: '#fff',
    border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700',
    cursor: 'pointer', marginTop: '8px',
});

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '16px', ...style }}>
            {children}
        </div>
    );
}
