// HU013 — Validación comunitaria de reportes (solo Ciudadano)
import { useState, useEffect } from 'react';
import DemoShell, { Card } from './DemoShell';
import { getSession, API_BASE } from './useSession';

const ESTADO_COLOR: Record<string, string> = { Pendiente:'#EF4444','En Proceso':'#F59E0B',Resuelto:'#22C55E',Rechazado:'#6B7280' };
const ESTADO_BG:   Record<string, string> = { Pendiente:'#FEE2E2','En Proceso':'#FEF3C7',Resuelto:'#DCFCE7',Rechazado:'#F3F4F6' };

interface Reporte {
    id: string; codigo: string; titulo: string; categoria: string; estado: string;
    foto?: string; fecha_creacion: string; direccion: string; nombre: string;
    confirmaciones: number; ya_confirme: boolean;
}

const NIVEL = (confirmaciones: number): { label: string; color: string; bg: string } => {
    if (confirmaciones >= 5) return { label: '🟢 Alta credibilidad',  color: '#16A34A', bg: '#F0FDF4' };
    if (confirmaciones >= 3) return { label: '🟠 Media credibilidad', color: '#D97706', bg: '#FFFBEB' };
    if (confirmaciones >= 1) return { label: '🟡 Baja credibilidad',  color: '#CA8A04', bg: '#FEFCE8' };
    return                          { label: '⚪ Sin validar',         color: '#94A3B8', bg: '#F8FAFC' };
};

const fmt = (s: string) => new Date(s).toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' });

export default function HU013_ValidacionComunitaria() {
    const sesion = getSession();
    const [reportes,      setReportes]      = useState<Reporte[]>([]);
    const [cargando,      setCargando]      = useState(true);
    const [confirmando,   setConfirmando]   = useState<string | null>(null);
    const [mensajes,      setMensajes]      = useState<Record<string, string>>({});

    const cargar = () => {
        if (!sesion) { setCargando(false); return; }
        fetch(`${API_BASE}/api/reports/para-confirmar`, {
            headers: { Authorization: `Bearer ${sesion.token}` },
        })
            .then(r => r.json())
            .then(d => setReportes(d.data || []))
            .finally(() => setCargando(false));
    };

    useEffect(() => { cargar(); }, []);

    const confirmar = async (r: Reporte) => {
        if (!sesion || r.ya_confirme) return;
        setConfirmando(r.id);
        try {
            const res = await fetch(`${API_BASE}/api/reports/${r.id}/confirmar`, {
                method:  'POST',
                headers: { Authorization: `Bearer ${sesion.token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setReportes(prev => prev.map(x =>
                    x.id === r.id ? { ...x, confirmaciones: x.confirmaciones + 1, ya_confirme: true } : x
                ));
                setMensajes(prev => ({ ...prev, [r.id]: '✅ ¡Confirmado! Gracias por validar.' }));
            } else {
                setMensajes(prev => ({ ...prev, [r.id]: data.message || 'Error.' }));
            }
        } finally {
            setConfirmando(null);
        }
    };

    const totalConfirmados = reportes.filter(r => r.ya_confirme).length;

    return (
        <DemoShell huId="HU013" titulo="Validación Comunitaria" integrante="William" color="#059669">

            {/* Explicación */}
            <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#065F46', margin: '0 0 6px' }}>
                    👥 ¿Cómo funciona?
                </p>
                <p style={{ fontSize: '12px', color: '#047857', margin: 0, lineHeight: '1.6' }}>
                    Si ves un reporte de un vecino y <strong>reconoces el problema</strong>, haz clic en "Yo también lo vi". Cada confirmación sube la credibilidad del reporte, ayudando al municipio a priorizar la atención.
                </p>
            </div>

            {/* Niveles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                    { label: '⚪ Sin validar', sub: '0 confirmaciones',  color: '#94A3B8' },
                    { label: '🟡 Baja',        sub: '1–2 confirmaciones', color: '#CA8A04' },
                    { label: '🟠 Media',        sub: '3–4 confirmaciones', color: '#D97706' },
                    { label: '🟢 Alta',         sub: '5+ confirmaciones',  color: '#16A34A' },
                ].map(n => (
                    <div key={n.label} style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: n.color, margin: '0 0 2px' }}>{n.label}</p>
                        <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>{n.sub}</p>
                    </div>
                ))}
            </div>

            {/* Stat */}
            {totalConfirmados > 0 && (
                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#16A34A', margin: 0 }}>
                        Has confirmado {totalConfirmados} reporte{totalConfirmados !== 1 ? 's' : ''} en esta sesión
                    </p>
                </div>
            )}

            {/* Lista */}
            <Card>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: '0 0 12px' }}>
                    Reportes de otros ciudadanos ({reportes.length})
                </h3>
                {cargando ? (
                    <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center' }}>Cargando reportes…</p>
                ) : reportes.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center' }}>No hay reportes activos de otros ciudadanos.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {reportes.map(r => {
                            const cred = NIVEL(r.confirmaciones);
                            return (
                                <div key={r.id} style={{ borderRadius: '12px', border: `1px solid ${r.ya_confirme ? '#BBF7D0' : '#E2E8F0'}`, overflow: 'hidden', backgroundColor: r.ya_confirme ? '#F0FDF4' : '#F8FAFC' }}>
                                    {r.foto && (
                                        <img src={r.foto} alt="" style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                                    )}
                                    <div style={{ padding: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: 0, flex: 1, marginRight: '8px' }}>{r.titulo}</p>
                                            <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 7px', borderRadius: '8px', flexShrink: 0,
                                                backgroundColor: ESTADO_BG[r.estado], color: ESTADO_COLOR[r.estado] }}>{r.estado}</span>
                                        </div>
                                        <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 6px' }}>
                                            {r.nombre} · {r.direccion} · {fmt(r.fecha_creacion)}
                                        </p>

                                        {/* Barra de credibilidad */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '700', color: cred.color, backgroundColor: cred.bg,
                                                padding: '3px 10px', borderRadius: '20px' }}>{cred.label}</span>
                                            <span style={{ fontSize: '12px', color: '#64748B' }}>👥 {r.confirmaciones}</span>
                                        </div>

                                        {mensajes[r.id] && (
                                            <p style={{ fontSize: '12px', color: '#16A34A', fontWeight: '600', margin: '0 0 8px' }}>{mensajes[r.id]}</p>
                                        )}

                                        {r.ya_confirme ? (
                                            <div style={{ backgroundColor: '#DCFCE7', borderRadius: '8px', padding: '8px 12px', textAlign: 'center' }}>
                                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#16A34A' }}>✓ Ya confirmaste este reporte</span>
                                            </div>
                                        ) : (
                                            <button onClick={() => confirmar(r)} disabled={confirmando === r.id} style={{
                                                width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
                                                cursor: confirmando === r.id ? 'not-allowed' : 'pointer',
                                                backgroundColor: confirmando === r.id ? '#A7F3D0' : '#059669',
                                                color: '#fff', fontWeight: '700', fontSize: '13px',
                                            }}>
                                                {confirmando === r.id ? 'Registrando…' : '👍 Yo también lo vi'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </DemoShell>
    );
}
