// HU010: Detalle de reporte propio con historial de cambios
import { useAxios } from '../../../hooks/useAxios';
import { API_URL } from '../../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { ICONS } from '../../../assets/icons';
import { IMAGES } from '../../../assets/images';
import { DetalleReporteResponse, EstadoReporte } from '../../../shared/types';
import { formatearFecha, formatearHora } from '../../../utils/formatters';
import TabBar from '../../ui/TabBar';

interface BackendResponse { success: boolean; data: DetalleReporteResponse | null; }

const COLOR: Record<EstadoReporte, { bg: string; text: string; border: string; dot: string }> = {
    'Pendiente':  { bg: '#FEE2E2', text: '#EF4444', border: '#FECACA', dot: '#EF4444' },
    'En Proceso': { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A', dot: '#D97706' },
    'Resuelto':   { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0', dot: '#16A34A' },
    'Rechazado':  { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB', dot: '#6B7280' },
};

export default function MyReportDetail() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [reportId, usuarioRol, fecha] = Array.isArray(state) ? state : [state, 'Ciudadano', ''];

    const { data: respuesta, loading, error } = useAxios<BackendResponse>('/api/reports/:id', { id: reportId, usuarioRol });
    const detalle = respuesta?.data;

    if (error) return <p style={{ padding: '16px', color: 'red' }}>Error: {error}</p>;

    const c = detalle ? (COLOR[detalle.estado] ?? COLOR['Pendiente']) : COLOR['Pendiente'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box' }}>
            <div style={{ backgroundColor: '#005c2e', padding: '42px 16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
                <button onClick={() => navigate('/my-reports')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><ICONS.ArrowLeft /></button>
                <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Estado del Reporte</h1>
                <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><ICONS.Bell /></button>
            </div>

            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Cargando…</div>
                ) : detalle ? (
                    <>
                        {/* Tarjeta principal */}
                        <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#e6f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ICONS.FileText /></div>
                                <div>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{detalle.codigo}</span>
                                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '2px 0 4px 0' }}>{detalle.titulo}</h3>
                                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{detalle.direccion}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}><ICONS.Calendar /><span style={{ fontSize: '11px', color: '#64748b' }}>{formatearFecha(fecha || detalle.fecha_creacion)}</span></div>
                                </div>
                            </div>

                            {detalle.foto && (
                                <img src={detalle.foto.startsWith('http') || detalle.foto.startsWith('/uploads') ? `${API_URL}${detalle.foto}` : IMAGES.basural1} alt="Evidencia" crossOrigin="anonymous" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '14px', marginBottom: '10px' }} />
                            )}

                            <p style={{ fontSize: '13px', color: '#475569', margin: '8px 0 12px 0', lineHeight: '1.5' }}>{detalle.descripcion}</p>

                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                                <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 6px 0', fontWeight: '600' }}>Estado actual</p>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '12px', backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`, fontSize: '13px', fontWeight: '700' }}>
                                    {detalle.estado === 'Rechazado' ? <ICONS.Refused /> : detalle.estado === 'Resuelto' ? <ICONS.Check /> : <ICONS.Info />}
                                    {detalle.estado}
                                </span>
                            </div>
                        </div>

                        {/* Historial */}
                        {detalle.historial_cambios?.length > 0 && (
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 4px' }}>Historial de cambios</p>
                                {detalle.historial_cambios.map((ev, i) => {
                                    const ec  = COLOR[ev.estado_asignado] ?? COLOR['Pendiente'];
                                    const isLast = i === detalle.historial_cambios.length - 1;
                                    return (
                                        <div key={ev.id} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', border: `4px solid ${ec.dot}`, boxSizing: 'border-box', zIndex: 2 }} />
                                                {!isLast && <div style={{ width: '2px', flex: 1, backgroundColor: '#cbd5e1', marginTop: '3px', marginBottom: '3px' }} />}
                                            </div>
                                            <div style={{ flex: 1, paddingBottom: isLast ? '0' : '20px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '8px', backgroundColor: ec.bg, color: ec.text, border: `1px solid ${ec.border}` }}>{ev.estado_asignado}</span>
                                                    <span style={{ fontSize: '11px', color: '#64748b' }}>{formatearFecha(ev.fecha)}</span>
                                                </div>
                                                <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 3px 0' }}>{ev.comentario}</p>
                                                {ev.usuario_nombre && <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{ev.usuario_nombre} • {formatearHora(ev.fecha)}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Aviso notificaciones */}
                        <div style={{ backgroundColor: '#f1f5f9', borderRadius: '16px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #e2e8f0', marginBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
                            <ICONS.BellOutline />
                            <div>
                                <p style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Notificaciones activas</p>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>Recibirás alertas cuando cambie el estado</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Reporte no encontrado.</p>
                )}
            </div>
            <TabBar currentTab="my-reports" />
        </div>
    );
}
