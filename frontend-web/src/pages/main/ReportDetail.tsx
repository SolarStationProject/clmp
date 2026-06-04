import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAxios } from '../../hooks/useAxios';
import { API_URL } from '../../services/api';
import { DetalleReporteResponse, EstadoReporte } from '../../shared/types';
import { ICONS } from '../../assets/icons';
import { formatearFecha, formatearHora } from '../../utils/formatters';

interface BackendResponse { success: boolean; data: DetalleReporteResponse | null; }

const COLOR_ESTADO: Record<EstadoReporte, { bg: string; text: string; border: string }> = {
    'Pendiente':  { bg: '#FEE2E2', text: '#EF4444', border: '#FECACA' },
    'En Proceso': { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
    'Resuelto':   { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' },
    'Rechazado':  { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
};

export default function ReportDetail() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [reportId, usuarioRol, fecha] = Array.isArray(state) ? state : [state, 'Administrador', ''];

    const { data: respuesta, loading, error } = useAxios<BackendResponse>('/api/reports/:id', { id: reportId, usuarioRol });
    const detalle = respuesta?.data;

    if (error) return <p style={{ padding: '16px', color: 'red' }}>Error: {error}</p>;

    const estadoColors = detalle ? (COLOR_ESTADO[detalle.estado] ?? COLOR_ESTADO['Pendiente']) : COLOR_ESTADO['Pendiente'];

    return (
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0', fontFamily: 'system-ui, sans-serif', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#005c2e', padding: '20px 16px', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                    <ICONS.ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Detalle del Reporte</h1>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Cargando…</div>
                ) : detalle ? (
                    <>
                        {/* Tarjeta principal */}
                        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{detalle.codigo}</span>
                                    <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '4px 0', color: '#1e293b' }}>{detalle.titulo}</h2>
                                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{detalle.direccion} — {detalle.comuna}</p>
                                </div>
                                <span style={{ padding: '6px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', backgroundColor: estadoColors.bg, color: estadoColors.text, border: `1px solid ${estadoColors.border}`, whiteSpace: 'nowrap' }}>
                                    {detalle.estado}
                                </span>
                            </div>

                            {detalle.foto && (
                                <img src={detalle.foto.startsWith('http') ? detalle.foto : `${API_URL}${detalle.foto}`} alt="Evidencia" crossOrigin="anonymous" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px' }} />
                            )}

                            <p style={{ fontSize: '14px', color: '#475569', margin: '8px 0 0 0', lineHeight: '1.5' }}>{detalle.descripcion}</p>
                            {detalle.categoria && <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Categoría: {detalle.categoria}</p>}
                            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Reportado: {formatearFecha(detalle.fecha_creacion)}</p>
                        </div>

                        {/* Historial */}
                        {detalle.historial_cambios?.length > 0 && (
                            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>Historial de cambios</p>
                                {detalle.historial_cambios.map((e, i) => {
                                    const c  = COLOR_ESTADO[e.estado_asignado] ?? COLOR_ESTADO['Pendiente'];
                                    const isLast = i === detalle.historial_cambios.length - 1;
                                    return (
                                        <div key={e.id} style={{ display: 'flex', gap: '14px', position: 'relative' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                                <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: c.text, zIndex: 2 }} />
                                                {!isLast && <div style={{ width: '2px', flex: 1, backgroundColor: '#cbd5e1', marginTop: '4px', marginBottom: '4px' }} />}
                                            </div>
                                            <div style={{ flex: 1, paddingBottom: isLast ? '0' : '20px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{ padding: '2px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{e.estado_asignado}</span>
                                                    <span style={{ fontSize: '12px', color: '#64748b' }}>{formatearFecha(e.fecha)}</span>
                                                </div>
                                                <p style={{ fontSize: '14px', color: '#334155', margin: '0 0 4px 0' }}>{e.comentario}</p>
                                                {e.usuario_nombre && <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{e.usuario_nombre} • {formatearHora(e.fecha)}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Comentarios internos — solo Administrador */}
                        {detalle.comentarios_internos && detalle.comentarios_internos.length > 0 && (
                            <div style={{ backgroundColor: '#fffbeb', borderRadius: '16px', padding: '16px', border: '1px solid #fde68a' }}>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>Notas internas (solo Administrador)</p>
                                {detalle.comentarios_internos.map(c => (
                                    <div key={c.id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #fde68a' }}>
                                        <p style={{ fontSize: '14px', color: '#78350f', margin: '0 0 4px 0' }}>{c.comentario}</p>
                                        <p style={{ fontSize: '12px', color: '#a16207', margin: 0 }}>{c.admin_nombre} • {formatearFecha(c.fecha_creacion)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Reporte no encontrado.</p>
                )}
            </div>
        </div>
    );
}
