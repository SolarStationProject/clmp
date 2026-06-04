// HU021 — Consultar detalles de reporte (API real)
// Admin ve comentarios internos, Ciudadano no los ve
// Resultado esperado: "Detalle completo del reporte visible"
import { useState, useEffect } from 'react';
import DemoShell, { SuccessMessage, Card } from './DemoShell';
import { getSession, API_BASE } from './useSession';

type EstadoReporte = 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Rechazado';
const COLOR: Record<EstadoReporte, string> = { 'Pendiente':'#EF4444','En Proceso':'#F59E0B','Resuelto':'#22C55E','Rechazado':'#6B7280' };
const BG:    Record<EstadoReporte, string> = { 'Pendiente':'#FEE2E2','En Proceso':'#FEF3C7','Resuelto':'#DCFCE7','Rechazado':'#F3F4F6' };
const TEXT:  Record<EstadoReporte, string> = { 'Pendiente':'#B91C1C','En Proceso':'#D97706','Resuelto':'#15803D','Rechazado':'#4B5563' };

const fmt  = (s: string) => new Date(s).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtH = (s: string) => { const d = new Date(s); return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`; };

interface Reporte { id: string; codigo: string; titulo: string; estado: EstadoReporte; direccion: string; comuna: string; descripcion?: string; categoria?: string; fecha_creacion: string; foto?: string; }
interface Historial { id: string; estado_asignado: EstadoReporte; comentario: string; fecha: string; usuario_nombre?: string; }
interface ComentarioInterno { id: string; comentario: string; admin_nombre?: string; fecha_creacion: string; }
interface Detalle extends Reporte { historial_cambios: Historial[]; comentarios_internos?: ComentarioInterno[]; }

export default function HU021_DetalleReporte() {
    const sesion = getSession();
    const [reportes,     setReportes]     = useState<Reporte[]>([]);
    const [cargando,     setCargando]     = useState(true);
    const [seleccionado, setSeleccionado] = useState<string | null>(null);
    const [detalle,      setDetalle]      = useState<Detalle | null>(null);
    const [cargandoDet,  setCargandoDet]  = useState(false);
    const [mostrarExito, setMostrarExito] = useState(false);

    useEffect(() => {
        if (!sesion) return;
        fetch(`${API_BASE}/api/reports/?usuarioId=${sesion.uid}&usuarioRol=${sesion.rol}`, {
            headers: { Authorization: `Bearer ${sesion.token}` },
        })
            .then(r => r.json())
            .then(d => setReportes(d.data || []))
            .catch(() => {})
            .finally(() => setCargando(false));
    }, []);

    const verDetalle = async (id: string) => {
        if (!sesion) return;
        setSeleccionado(id);
        setDetalle(null);
        setCargandoDet(true);
        try {
            const res  = await fetch(`${API_BASE}/api/reports/${id}?id=${id}&usuarioRol=${sesion.rol}`, {
                headers: { Authorization: `Bearer ${sesion.token}` },
            });
            const data = await res.json();
            if (res.ok && data.data) { setDetalle(data.data); setMostrarExito(true); }
        } catch { /* silencioso */ }
        finally { setCargandoDet(false); }
    };

    return (
        <DemoShell huId="HU021" titulo="Consultar Detalles de Reporte" integrante="Julián" color="#D97706">

            {/* Badge de rol */}
            <div style={{ backgroundColor: sesion?.rol === 'Administrador' ? '#FFFBEB' : '#EFF6FF', border: `1px solid ${sesion?.rol === 'Administrador' ? '#FDE68A' : '#BFDBFE'}`, borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: sesion?.rol === 'Administrador' ? '#D97706' : '#2563EB' }}>
                {sesion?.rol === 'Administrador'
                    ? '👔 Administrador — ves las notas internas del equipo'
                    : '👤 Ciudadano — las notas internas están ocultas'}
            </div>

            {/* Lista de reportes */}
            <Card>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: '0 0 12px 0' }}>Selecciona un reporte para ver su detalle</h3>
                {cargando ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Cargando reportes…</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                        {reportes.map(r => (
                            <div key={r.id} onClick={() => verDetalle(r.id)}
                                style={{ padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', border: `2px solid ${seleccionado === r.id ? COLOR[r.estado] : '#F1F5F9'}`, backgroundColor: seleccionado === r.id ? BG[r.estado] : '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', margin: '0 0 1px 0' }}>{r.titulo}</p>
                                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>{r.codigo} · {r.comuna}</p>
                                </div>
                                <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', backgroundColor: BG[r.estado], color: TEXT[r.estado], whiteSpace: 'nowrap', marginLeft: '8px' }}>{r.estado}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Detalle completo */}
            {seleccionado && (
                cargandoDet ? (
                    <Card><p style={{ textAlign: 'center', color: '#94a3b8' }}>Cargando detalle…</p></Card>
                ) : detalle ? (
                    <>
                        <Card>
                            {/* Foto placeholder */}
                            <div style={{ backgroundColor: '#F1F5F9', borderRadius: '12px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', border: '2px dashed #CBD5E1' }}>
                                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                    <div style={{ fontSize: '28px' }}>📸</div>
                                    <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Fotografía de evidencia</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>{detalle.codigo}</span>
                                    <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', margin: '3px 0 4px 0' }}>{detalle.titulo}</h2>
                                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 2px 0' }}>📍 {detalle.direccion}, {detalle.comuna}</p>
                                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 2px 0' }}>📅 {fmt(detalle.fecha_creacion)}</p>
                                    {detalle.categoria && <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>🏷️ {detalle.categoria}</p>}
                                </div>
                                <span style={{ padding: '5px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', backgroundColor: BG[detalle.estado], color: TEXT[detalle.estado], marginLeft: '12px', whiteSpace: 'nowrap' }}>{detalle.estado}</span>
                            </div>

                            {detalle.descripcion && (
                                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', margin: '0 0 6px 0' }}>Descripción</p>
                                    <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.6' }}>{detalle.descripcion}</p>
                                </div>
                            )}
                        </Card>

                        {/* Historial */}
                        <Card>
                            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px 0' }}>Historial de cambios</h3>
                            {detalle.historial_cambios?.length > 0 ? detalle.historial_cambios.map((h, i) => {
                                const isLast = i === detalle.historial_cambios.length - 1;
                                return (
                                    <div key={h.id} style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLOR[h.estado_asignado] }} />
                                            {!isLast && <div style={{ width: '2px', flex: 1, backgroundColor: '#CBD5E1', marginTop: '3px', marginBottom: '3px' }} />}
                                        </div>
                                        <div style={{ flex: 1, paddingBottom: isLast ? '0' : '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: '700', padding: '1px 8px', borderRadius: '6px', backgroundColor: BG[h.estado_asignado], color: TEXT[h.estado_asignado] }}>{h.estado_asignado}</span>
                                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{fmt(h.fecha)} {fmtH(h.fecha)}</span>
                                            </div>
                                            <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 2px 0' }}>{h.comentario}</p>
                                            {h.usuario_nombre && <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>👤 {h.usuario_nombre}</p>}
                                        </div>
                                    </div>
                                );
                            }) : <p style={{ fontSize: '13px', color: '#94a3b8' }}>Sin cambios registrados.</p>}
                        </Card>

                        {/* Comentarios internos — solo admin */}
                        {detalle.comentarios_internos && detalle.comentarios_internos.length > 0 && (
                            <Card style={{ borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }}>
                                <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>
                                    🔒 Notas internas (solo Administrador)
                                </h3>
                                {detalle.comentarios_internos.map(c => (
                                    <div key={c.id} style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '10px', border: '1px solid #FDE68A', marginBottom: '8px' }}>
                                        <p style={{ fontSize: '13px', color: '#78350F', margin: '0 0 4px 0' }}>{c.comentario}</p>
                                        <p style={{ fontSize: '11px', color: '#A16207', margin: 0 }}>👔 {c.admin_nombre} · {fmt(c.fecha_creacion)}</p>
                                    </div>
                                ))}
                            </Card>
                        )}

                        {mostrarExito && <SuccessMessage mensaje="Detalle completo del reporte visible" />}
                    </>
                ) : null
            )}
        </DemoShell>
    );
}
