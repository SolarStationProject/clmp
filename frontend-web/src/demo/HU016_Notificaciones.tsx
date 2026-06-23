// HU016 — Notificaciones por email al cambiar estado de reporte
import { useState, useEffect } from 'react';
import DemoShell, { Card } from './DemoShell';
import { getSession, API_BASE } from './useSession';

interface Reporte {
    id: string; codigo: string; titulo: string; estado: string;
    categoria: string; fecha_creacion: string; direccion: string; comuna: string;
    nombre: string; eliminado?: boolean;
}

const COLOR: Record<string, string> = { Pendiente:'#EF4444','En Proceso':'#F59E0B',Resuelto:'#22C55E',Rechazado:'#6B7280' };
const BG:    Record<string, string> = { Pendiente:'#FEE2E2','En Proceso':'#FEF3C7',Resuelto:'#DCFCE7',Rechazado:'#F3F4F6' };
const ICON:  Record<string, string> = { Pendiente:'⏳','En Proceso':'🔄',Resuelto:'✅',Rechazado:'❌' };

const fmt = (s: string) => new Date(s).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

export default function HU016_Notificaciones() {
    const sesion = getSession();
    const [reportes, setReportes] = useState<Reporte[]>([]);
    const [cargando, setCargando] = useState(true);
    const [filtro,   setFiltro]   = useState<'todos'|'notificados'>('notificados');

    useEffect(() => {
        if (!sesion) return;
        fetch(`${API_BASE}/api/reports/?usuarioId=${sesion.uid}&usuarioRol=Administrador`, {
            headers: { Authorization: `Bearer ${sesion.token}` },
        })
            .then(r => r.json())
            .then(d => setReportes(d.data || []))
            .finally(() => setCargando(false));
    }, []);

    const notificados  = reportes.filter(r => r.estado !== 'Pendiente' && !r.eliminado);
    const mostrar      = filtro === 'notificados' ? notificados : reportes.filter(r => !r.eliminado);

    return (
        <DemoShell huId="HU016" titulo="Notificaciones por Email" integrante="Alex" color="#0369A1">

            {/* Explicación del flujo */}
            <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E40AF', margin: '0 0 6px' }}>
                    📧 ¿Cómo funciona?
                </p>
                <p style={{ fontSize: '12px', color: '#1D4ED8', margin: 0, lineHeight: '1.6' }}>
                    Cada vez que el administrador cambia el estado de un reporte (desde HU006), el ciudadano recibe automáticamente un email con el nuevo estado y el comentario ingresado. Los usuarios demo (<code>@ciudadano.cl</code>) simulan el envío sin consumir créditos SendGrid.
                </p>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {[
                    { label: 'Total reportes', valor: reportes.filter(r => !r.eliminado).length, color: '#0369A1', bg: '#EFF6FF' },
                    { label: 'Notif. enviadas', valor: notificados.length,                        color: '#22C55E', bg: '#F0FDF4' },
                    { label: 'Aún Pendiente',   valor: reportes.filter(r => r.estado === 'Pendiente' && !r.eliminado).length, color: '#F59E0B', bg: '#FFFBEB' },
                ].map(k => (
                    <div key={k.label} style={{ backgroundColor: k.bg, borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                        <p style={{ fontSize: '24px', fontWeight: '800', color: k.color, margin: '0 0 2px' }}>{k.valor}</p>
                        <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>{k.label}</p>
                    </div>
                ))}
            </div>

            {/* Filtro */}
            <Card>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    {(['notificados', 'todos'] as const).map(f => (
                        <button key={f} onClick={() => setFiltro(f)} style={{
                            padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                            fontSize: '13px', fontWeight: '600',
                            backgroundColor: filtro === f ? '#0369A1' : '#F1F5F9',
                            color: filtro === f ? '#fff' : '#64748B',
                        }}>
                            {f === 'notificados' ? `Notificados (${notificados.length})` : `Todos (${reportes.filter(r => !r.eliminado).length})`}
                        </button>
                    ))}
                </div>

                {cargando ? (
                    <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center' }}>Cargando reportes…</p>
                ) : mostrar.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center' }}>Sin registros.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                        {mostrar.map(r => (
                            <div key={r.id} style={{
                                display: 'flex', gap: '12px', alignItems: 'center',
                                padding: '12px 14px', borderRadius: '10px', backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                            }}>
                                {/* Ícono estado */}
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                                    backgroundColor: BG[r.estado] || '#F3F4F6',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                                }}>
                                    {ICON[r.estado] || '📋'}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: '0 0 2px',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titulo}</p>
                                    <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>
                                        {r.codigo} · {r.nombre} · {fmt(r.fecha_creacion)}
                                    </p>
                                </div>

                                {/* Badges */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', flexShrink: 0 }}>
                                    <span style={{
                                        fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '8px',
                                        backgroundColor: BG[r.estado] || '#F3F4F6',
                                        color: COLOR[r.estado] || '#64748B',
                                    }}>{r.estado}</span>
                                    {r.estado !== 'Pendiente' && (
                                        <span style={{ fontSize: '10px', color: '#22C55E', fontWeight: '600' }}>
                                            ✉ notificado
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Nota sobre demo */}
            <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px 14px' }}>
                <p style={{ fontSize: '12px', color: '#92400E', margin: 0, lineHeight: '1.6' }}>
                    ⚠️ <strong>Modo demo:</strong> los emails a usuarios <code>@ciudadano.cl</code> se simulan en consola del servidor y no se envían realmente. Solo cuentas con email real recibirán la notificación.
                </p>
            </div>
        </DemoShell>
    );
}
