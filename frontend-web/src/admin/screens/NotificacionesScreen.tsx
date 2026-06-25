import { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface Reporte {
    id: string; codigo: string; titulo: string; estado: string;
    categoria: string; fecha_creacion: string; nombre: string; eliminado?: boolean;
}

const COLOR: Record<string, string> = { Pendiente:'#EF4444','En Proceso':'#F59E0B',Resuelto:'#22C55E',Rechazado:'#6B7280' };
const BG: Record<string, string>    = { Pendiente:'#FEE2E2','En Proceso':'#FEF3C7',Resuelto:'#DCFCE7',Rechazado:'#F3F4F6' };
const ICON: Record<string, string>  = { Pendiente:'⏳','En Proceso':'🔄',Resuelto:'✅',Rechazado:'❌' };

const fmt = (s: string) =>
    new Date(s).toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' });

export default function NotificacionesScreen() {
    const [reportes, setReportes] = useState<Reporte[]>([]);
    const [cargando, setCargando] = useState(true);
    const [filtro,   setFiltro]   = useState<'notificados'|'todos'>('notificados');

    const uid = localStorage.getItem('cleanmap_uid') || '';

    useEffect(() => {
        api.get<{ data: Reporte[] }>(`/api/reports/?usuarioId=${uid}&usuarioRol=Administrador`)
            .then(r => setReportes(r.data.data || []))
            .finally(() => setCargando(false));
    }, []);

    const activos     = reportes.filter(r => !r.eliminado);
    const notificados = activos.filter(r => r.estado !== 'Pendiente');
    const pendientes  = activos.filter(r => r.estado === 'Pendiente');
    const mostrar     = filtro === 'notificados' ? notificados : activos;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Explicación */}
            <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E40AF', margin: '0 0 6px' }}>📧 ¿Cómo funciona?</p>
                <p style={{ fontSize: '13px', color: '#1D4ED8', margin: 0, lineHeight: 1.6 }}>
                    Cada vez que el administrador cambia el estado de un reporte (desde Reportes), el ciudadano
                    recibe automáticamente un email con el nuevo estado y el comentario ingresado.
                    Los usuarios demo (<code>@ciudadano.cl</code>) simulan el envío sin consumir créditos SendGrid.
                </p>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                {[
                    { label: 'Total reportes',  valor: activos.length,     color: '#0369A1', bg: '#EFF6FF', border: '#BFDBFE' },
                    { label: 'Notif. enviadas', valor: notificados.length,  color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0' },
                    { label: 'Aún Pendiente',   valor: pendientes.length,   color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
                ].map(k => (
                    <div key={k.label} style={{ backgroundColor: k.bg, border: `1px solid ${k.border}`, borderRadius: '14px', padding: '20px 16px', textAlign: 'center' }}>
                        <p style={{ fontSize: '38px', fontWeight: '900', color: k.color, margin: '0 0 6px', lineHeight: 1 }}>{k.valor}</p>
                        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>{k.label}</p>
                    </div>
                ))}
            </div>

            {/* Lista */}
            <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
                    {(['notificados', 'todos'] as const).map(f => (
                        <button key={f} onClick={() => setFiltro(f)} style={{
                            padding: '7px 18px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                            fontSize: '13px', fontWeight: '600',
                            backgroundColor: filtro === f ? '#0369A1' : '#F1F5F9',
                            color: filtro === f ? '#fff' : '#64748B',
                        }}>
                            {f === 'notificados' ? `Notificados (${notificados.length})` : `Todos (${activos.length})`}
                        </button>
                    ))}
                </div>

                {cargando ? (
                    <p style={{ fontSize: '14px', color: '#94A3B8', textAlign: 'center', padding: '40px 0' }}>Cargando reportes…</p>
                ) : mostrar.length === 0 ? (
                    <p style={{ fontSize: '14px', color: '#94A3B8', textAlign: 'center', padding: '40px 0' }}>Sin registros.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {mostrar.map(r => (
                            <div key={r.id} style={{
                                display: 'flex', gap: '14px', alignItems: 'center',
                                padding: '14px 16px', borderRadius: '10px',
                                backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
                            }}>
                                <div style={{
                                    width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                                    backgroundColor: BG[r.estado] || '#F3F4F6',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                                }}>
                                    {ICON[r.estado] || '📋'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{
                                        fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: '0 0 2px',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>{r.titulo}</p>
                                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                                        {r.codigo} · {r.nombre} · {fmt(r.fecha_creacion)}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', flexShrink: 0 }}>
                                    <span style={{
                                        fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '8px',
                                        backgroundColor: BG[r.estado] || '#F3F4F6', color: COLOR[r.estado] || '#64748B',
                                    }}>{r.estado}</span>
                                    {r.estado !== 'Pendiente' && (
                                        <span style={{ fontSize: '11px', color: '#22C55E', fontWeight: '600' }}>✉ notificado</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Nota demo */}
            <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '12px 16px' }}>
                <p style={{ fontSize: '12px', color: '#92400E', margin: 0, lineHeight: 1.6 }}>
                    ⚠️ <strong>Modo demo:</strong> los emails a usuarios <code>@ciudadano.cl</code> se simulan en consola del
                    servidor y no se envían realmente. Solo cuentas con email real recibirán la notificación.
                </p>
            </div>
        </div>
    );
}
