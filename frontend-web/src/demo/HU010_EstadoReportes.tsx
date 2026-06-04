// HU010 — Consultar estado de reportes (API real + polling cada 10s)
// Resultado esperado: "Estado del reporte visible con lo solicitado"
import { useState, useEffect, useRef } from 'react';
import DemoShell, { SuccessMessage, Card } from './DemoShell';
import { getSession } from './useSession';

type EstadoReporte = 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Rechazado';

const COLOR: Record<EstadoReporte, string> = { 'Pendiente':'#EF4444','En Proceso':'#F59E0B','Resuelto':'#22C55E','Rechazado':'#6B7280' };
const BG:    Record<EstadoReporte, string> = { 'Pendiente':'#FEE2E2','En Proceso':'#FEF3C7','Resuelto':'#DCFCE7','Rechazado':'#F3F4F6' };
const TEXT:  Record<EstadoReporte, string> = { 'Pendiente':'#B91C1C','En Proceso':'#D97706','Resuelto':'#15803D','Rechazado':'#4B5563' };

const fmt = (s: string) => new Date(s).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtH = (s: string) => { const d = new Date(s); return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`; };

interface Reporte { id: string; codigo: string; titulo: string; estado: EstadoReporte; direccion: string; fecha_creacion: string; rol?: string; }
interface Historial { id: string; estado_asignado: EstadoReporte; comentario: string; fecha: string; usuario_nombre?: string; }
interface DetalleRes { success: boolean; data: Reporte & { historial_cambios: Historial[] } | null; }

export default function HU010_EstadoReportes() {
    const sesion = getSession();
    const [reportes,     setReportes]     = useState<Reporte[]>([]);
    const [cargando,     setCargando]     = useState(true);
    const [seleccionado, setSeleccionado] = useState<string | null>(null);
    const [detalle,      setDetalle]      = useState<(Reporte & { historial_cambios: Historial[] }) | null>(null);
    const [cargandoDet,  setCargandoDet]  = useState(false);
    const [notif,        setNotif]        = useState('');
    const [mostrarExito, setMostrarExito] = useState(false);
    const estadosAnteriores = useRef<Record<string, EstadoReporte>>({});

    const cargarReportes = async (silencioso = false) => {
        if (!sesion) return;
        if (!silencioso) setCargando(true);
        try {
            const res  = await fetch(`/api/reports/my-reports?ciudadanoId=${sesion.uid}`, {
                headers: { Authorization: `Bearer ${sesion.token}` },
            });
            const data = await res.json();
            if (!res.ok) return;
            const nuevos: Reporte[] = data.data || [];

            // Detectar cambios de estado para notificaciones
            nuevos.forEach(r => {
                const anterior = estadosAnteriores.current[r.id];
                if (anterior && anterior !== r.estado) {
                    setNotif(`📲 "${r.titulo}" cambió de ${anterior} → ${r.estado}`);
                    setTimeout(() => setNotif(''), 5000);
                }
                estadosAnteriores.current[r.id] = r.estado;
            });

            setReportes(nuevos);
        } catch { /* silencioso */ }
        finally { if (!silencioso) setCargando(false); }
    };

    // Carga inicial + polling cada 10 segundos
    useEffect(() => {
        cargarReportes();
        const interval = setInterval(() => cargarReportes(true), 10000);
        return () => clearInterval(interval);
    }, []);

    const verDetalle = async (id: string) => {
        if (!sesion) return;
        setSeleccionado(id);
        setMostrarExito(true);
        setCargandoDet(true);
        try {
            const res  = await fetch(`/api/reports/${id}?id=${id}&usuarioRol=${sesion.rol}`, {
                headers: { Authorization: `Bearer ${sesion.token}` },
            });
            const data: DetalleRes = await res.json();
            if (res.ok && data.data) setDetalle(data.data);
        } catch { /* silencioso */ }
        finally { setCargandoDet(false); }
    };

    const stats = {
        total:     reportes.length,
        pendiente: reportes.filter(r => r.estado === 'Pendiente').length,
        enProceso: reportes.filter(r => r.estado === 'En Proceso').length,
        resuelto:  reportes.filter(r => r.estado === 'Resuelto').length,
        rechazado: reportes.filter(r => r.estado === 'Rechazado').length,
    };

    return (
        <DemoShell huId="HU010" titulo="Consultar Estado de Reportes" integrante="Julián" color="#D97706">

            {/* Notificación de cambio */}
            {notif && (
                <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#D97706', fontWeight: '600' }}>
                    {notif}
                </div>
            )}

            {/* Estadísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                {(['Pendiente','En Proceso','Resuelto','Rechazado'] as EstadoReporte[]).map(e => (
                    <div key={e} style={{ backgroundColor: BG[e], borderRadius: '10px', padding: '10px', textAlign: 'center', border: `1px solid ${COLOR[e]}30` }}>
                        <p style={{ fontSize: '20px', fontWeight: '800', color: TEXT[e], margin: 0 }}>
                            {e === 'Pendiente' ? stats.pendiente : e === 'En Proceso' ? stats.enProceso : e === 'Resuelto' ? stats.resuelto : stats.rechazado}
                        </p>
                        <p style={{ fontSize: '10px', color: TEXT[e], margin: '2px 0 0 0', fontWeight: '600' }}>{e}</p>
                    </div>
                ))}
            </div>

            {/* Lista */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: 0 }}>📋 Mis Reportes</h3>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Se actualiza cada 10s</span>
                </div>

                {cargando ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Cargando reportes…</p>
                ) : reportes.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No tienes reportes creados.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {reportes.map(r => (
                            <div key={r.id} onClick={() => verDetalle(r.id)}
                                style={{ padding: '14px', borderRadius: '14px', cursor: 'pointer', border: `2px solid ${seleccionado === r.id ? COLOR[r.estado] : '#F1F5F9'}`, backgroundColor: seleccionado === r.id ? BG[r.estado] : '#F8FAFC' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>{r.codigo}</span>
                                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '8px', backgroundColor: BG[r.estado], color: TEXT[r.estado] }}>{r.estado}</span>
                                </div>
                                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: '0 0 3px 0' }}>{r.titulo}</h4>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>📍 {r.direccion} · 📅 {fmt(r.fecha_creacion)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Detalle */}
            {seleccionado && (
                <Card>
                    {cargandoDet ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Cargando historial…</p>
                    ) : detalle ? (
                        <>
                            <div style={{ backgroundColor: BG[detalle.estado], borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '18px' }}>{detalle.estado === 'Resuelto' ? '✅' : detalle.estado === 'Rechazado' ? '❌' : detalle.estado === 'En Proceso' ? '⚙️' : '⏳'}</span>
                                <div>
                                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 2px 0' }}>Estado actual</p>
                                    <p style={{ fontSize: '15px', fontWeight: '800', color: TEXT[detalle.estado], margin: 0 }}>{detalle.estado}</p>
                                </div>
                            </div>

                            {detalle.historial_cambios?.length > 0 ? (
                                <>
                                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>Historial de cambios</p>
                                    {detalle.historial_cambios.map((h, i) => {
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
                                    })}
                                </>
                            ) : (
                                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Sin cambios registrados aún.</p>
                            )}
                        </>
                    ) : null}
                </Card>
            )}

            {mostrarExito && <SuccessMessage mensaje="Estado del reporte visible con lo solicitado" />}
        </DemoShell>
    );
}
