// HU021: Detalle completo de un reporte (abierto desde mapa o lista)
// Admin ve comentarios internos, Ciudadano no los ve
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

export default function ReportDetail() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [reportId, usuarioRol] = Array.isArray(state) ? state : [state, 'Ciudadano'];

    const { data: respuesta, loading, error } = useAxios<BackendResponse>('/api/reports/:id', { id: reportId, usuarioRol });
    const detalle = respuesta?.data;

    if (error) return <p style={{ padding: '16px', color: 'red' }}>Error: {error}</p>;

    const c = detalle ? (COLOR[detalle.estado] ?? COLOR['Pendiente']) : COLOR['Pendiente'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box' }}>
            <div style={{ backgroundColor: '#005c2e', padding: '42px 16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><ICONS.ArrowLeft /></button>
                <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Detalle del Reporte</h1>
                <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><ICONS.Bell /></button>
            </div>

            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Cargando…</div>
                ) : detalle ? (
                    <>
                        {/* Tarjeta principal */}
                        <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{detalle.codigo}</span>
                                    <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '3px 0 4px 0' }}>{detalle.titulo}</h2>
                                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{detalle.direccion} — {detalle.comuna}</p>
                                </div>
                                <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`, whiteSpace: 'nowrap', marginLeft: '8px' }}>{detalle.estado}</span>
                            </div>

                            {detalle.foto && (
                                <img src={detalle.foto.startsWith('http') || detalle.foto.startsWith('/uploads') ? `${API_URL}${detalle.foto}` : IMAGES.basural1} alt="Evidencia" crossOrigin="anonymous" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '14px', marginBottom: '10px' }} />
                            )}

                            <p style={{ fontSize: '13px', color: '#475569', margin: '8px 0 4px 0', lineHeight: '1.5' }}>{detalle.descripcion}</p>
                            {detalle.categoria && <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Categoría: {detalle.categoria}</p>}
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>Reportado: {formatearFecha(detalle.fecha_creacion)}</p>
                        </div>

                        {/* Historial */}
                        {detalle.historial_cambios?.length > 0 && (
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 4px' }}>Historial de cambios</p>
                                {detalle.historial_cambios.map((ev, i) => {
                                    const ec  = COLOR[ev.estado_asignado] ?? COLOR['Pendiente'];
                                    const isLast = i === detalle.historial_cambios.length - 1;
                                    return (
                                        <div key={ev.id} style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', border: `4px solid ${ec.dot}`, boxSizing: 'border-box', zIndex: 2 }} />
                                                {!isLast && <div style={{ width: '2px', flex: 1, backgroundColor: '#cbd5e1', marginTop: '3px', marginBottom: '3px' }} />}
                                            </div>
                                            <div style={{ flex: 1, paddingBottom: isLast ? '0' : '18px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '8px', backgroundColor: ec.bg, color: ec.text, border: `1px solid ${ec.border}` }}>{ev.estado_asignado}</span>
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

                        {/* Comentarios internos — HU021: solo admin */}
                        {detalle.comentarios_internos && detalle.comentarios_internos.length > 0 && (
                            <div style={{ backgroundColor: '#fffbeb', borderRadius: '16px', padding: '12px', border: '1px solid #fde68a', marginBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
                                <p style={{ fontSize: '11px', fontWeight: '700', color: '#92400e', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Notas internas (solo Administrador)</p>
                                {detalle.comentarios_internos.map(ci => (
                                    <div key={ci.id} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #fde68a' }}>
                                        <p style={{ fontSize: '13px', color: '#78350f', margin: '0 0 3px 0' }}>{ci.comentario}</p>
                                        <p style={{ fontSize: '11px', color: '#a16207', margin: 0 }}>{ci.admin_nombre} • {formatearFecha(ci.fecha_creacion)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!detalle.comentarios_internos && <div style={{ marginBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }} />}
                    </>
                ) : (
                    <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Reporte no encontrado.</p>
                )}
            </div>
            <TabBar currentTab="map" />
        </div>
    );
}
