import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, API_URL } from '../../services/api';

type EstadoReporte = 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Rechazado';

const ES: Record<EstadoReporte, { bg: string; text: string; dot: string }> = {
    'Pendiente':  { bg: '#FEE2E2', text: '#B91C1C', dot: '#EF4444' },
    'En Proceso': { bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B' },
    'Resuelto':   { bg: '#DCFCE7', text: '#15803D', dot: '#22C55E' },
    'Rechazado':  { bg: '#F3F4F6', text: '#4B5563', dot: '#6B7280' },
};

const CRED = (conf: number, verif: boolean) => {
    if (verif && conf >= 5) return { label: '🟢 Alta credibilidad',  color: '#16A34A', bg: '#F0FDF4' };
    if (verif || conf >= 3) return { label: '🟠 Media credibilidad', color: '#D97706', bg: '#FFFBEB' };
    if (conf >= 1)          return { label: '🟡 Baja credibilidad',  color: '#CA8A04', bg: '#FEFCE8' };
    return                         { label: '⚪ Sin validar',         color: '#94A3B8', bg: '#F8FAFC' };
};

const fmt  = (s: string) => new Date(s).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtH = (s: string) => { const d = new Date(s); return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`; };

interface Historial { id: string; estado_asignado: EstadoReporte; comentario: string; fecha: string; usuario_nombre?: string; }
interface Detalle {
    id: string; codigo: string; titulo: string; estado: EstadoReporte;
    direccion: string; comuna: string; descripcion?: string;
    categoria?: string; fecha_creacion: string; foto?: string;
    ciudadano_id?: string; confirmaciones?: number; verificado_admin?: boolean;
    historial_cambios: Historial[];
}

export default function ReporteDetalleScreen() {
    const navigate  = useNavigate();
    const { state } = useLocation();
    const reportId  = typeof state === 'string' ? state : String(state ?? '');
    const uid       = localStorage.getItem('cleanmap_uid') || '';

    const [detalle,    setDetalle]    = useState<Detalle | null>(null);
    const [cargando,   setCargando]   = useState(true);
    const [errCarga,   setErrCarga]   = useState('');
    const [modalDel,   setModalDel]   = useState(false);
    const [eliminando, setEliminando] = useState(false);
    const [errDel,     setErrDel]     = useState('');

    useEffect(() => {
        if (!reportId) { setCargando(false); return; }
        api.get<{ data: Detalle }>(`/api/reports/${reportId}`, { params: { usuarioRol: 'Ciudadano' } })
            .then(r => setDetalle(r.data.data))
            .catch((e) => setErrCarga(e?.message || 'Error de conexión'))
            .finally(() => setCargando(false));
    }, [reportId]);

    const eliminar = async () => {
        setEliminando(true); setErrDel('');
        try {
            await api.delete(`/api/reports/${reportId}`);
            navigate('/app/mis-reportes', { replace: true });
        } catch (e: any) {
            setErrDel(e?.response?.data?.message || 'Error al eliminar.');
            setEliminando(false);
        }
    };

    const esMio    = detalle?.ciudadano_id === uid;
    const editable = esMio && detalle?.estado === 'Pendiente';

    const card: React.CSSProperties = {
        backgroundColor: '#fff', borderRadius: '14px',
        padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* Header */}
            <div style={{ backgroundColor: '#005c2e', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>‹</button>
                <h1 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {detalle ? detalle.titulo : 'Detalle del reporte'}
                </h1>
                {detalle && (
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', backgroundColor: ES[detalle.estado].bg, color: ES[detalle.estado].text, flexShrink: 0 }}>
                        {detalle.estado}
                    </span>
                )}
            </div>

            {/* Contenido scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {cargando ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>Cargando…</div>
                ) : !detalle ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '15px' }}>Reporte no encontrado.</p>
                        {errCarga && <p style={{ margin: 0, fontSize: '12px', color: '#EF4444', fontFamily: 'monospace' }}>{errCarga}</p>}
                    </div>
                ) : (
                    <>
                        {/* Foto */}
                        {detalle.foto ? (
                            <img
                                src={detalle.foto.startsWith('http') || detalle.foto.startsWith('data:') ? detalle.foto : `${API_URL}${detalle.foto}`}
                                alt="Evidencia"
                                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '14px' }}
                            />
                        ) : (
                            <div style={{ ...card, height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #CBD5E1', color: '#94A3B8', gap: '8px' }}>
                                <span style={{ fontSize: '22px' }}>📸</span>
                                <span style={{ fontSize: '13px' }}>Sin fotografía</span>
                            </div>
                        )}

                        {/* Info principal */}
                        <div style={card}>
                            <p style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{detalle.codigo}</p>
                            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B', margin: '0 0 12px 0' }}>{detalle.titulo}</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: detalle.descripcion ? '12px' : 0 }}>
                                <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>📍 {detalle.direccion}, {detalle.comuna}</p>
                                <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>📅 {fmt(detalle.fecha_creacion)}</p>
                                {detalle.categoria && <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>🏷️ {detalle.categoria}</p>}
                            </div>
                            {detalle.descripcion && (
                                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', margin: '0 0 6px 0', textTransform: 'uppercase' }}>Descripción</p>
                                    <p style={{ fontSize: '14px', color: '#334155', margin: 0, lineHeight: 1.6 }}>{detalle.descripcion}</p>
                                </div>
                            )}
                        </div>

                        {/* Credibilidad */}
                        {(() => {
                            const conf  = detalle.confirmaciones ?? 0;
                            const verif = detalle.verificado_admin ?? false;
                            const cred  = CRED(conf, verif);
                            return (
                                <div style={card}>
                                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credibilidad</p>
                                    <div style={{ backgroundColor: cred.bg, borderRadius: '10px', padding: '10px 14px', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: cred.color }}>{cred.label}</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                        <div style={{ backgroundColor: '#F0FDF4', borderRadius: '10px', padding: '10px', textAlign: 'center', border: '1px solid #BBF7D0' }}>
                                            <p style={{ fontSize: '18px', margin: '0 0 2px' }}>🤖</p>
                                            <p style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', margin: '0 0 1px' }}>Gemini AI</p>
                                            <p style={{ fontSize: '10px', color: '#64748B', margin: 0 }}>Verificada</p>
                                        </div>
                                        <div style={{ backgroundColor: verif ? '#F0FDF4' : '#F8FAFC', borderRadius: '10px', padding: '10px', textAlign: 'center', border: `1px solid ${verif ? '#BBF7D0' : '#E2E8F0'}` }}>
                                            <p style={{ fontSize: '18px', margin: '0 0 2px' }}>{verif ? '✅' : '⏳'}</p>
                                            <p style={{ fontSize: '11px', fontWeight: '700', color: verif ? '#16A34A' : '#94A3B8', margin: '0 0 1px' }}>Municipio</p>
                                            <p style={{ fontSize: '10px', color: '#64748B', margin: 0 }}>{verif ? 'Verificado' : 'Pendiente'}</p>
                                        </div>
                                        <div style={{ backgroundColor: conf > 0 ? '#FFFBEB' : '#F8FAFC', borderRadius: '10px', padding: '10px', textAlign: 'center', border: `1px solid ${conf > 0 ? '#FDE68A' : '#E2E8F0'}` }}>
                                            <p style={{ fontSize: '18px', margin: '0 0 2px' }}>👥</p>
                                            <p style={{ fontSize: '11px', fontWeight: '700', color: conf > 0 ? '#D97706' : '#94A3B8', margin: '0 0 1px' }}>{conf} vecinos</p>
                                            <p style={{ fontSize: '10px', color: '#64748B', margin: 0 }}>Confirmaron</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Historial de cambios */}
                        {detalle.historial_cambios?.length > 0 && (
                            <div style={card}>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Historial de cambios</p>
                                {detalle.historial_cambios.map((h, i) => {
                                    const s      = ES[h.estado_asignado] ?? ES['Pendiente'];
                                    const isLast = i === detalle.historial_cambios.length - 1;
                                    return (
                                        <div key={h.id} style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: s.dot }} />
                                                {!isLast && <div style={{ width: '2px', flex: 1, backgroundColor: '#CBD5E1', margin: '3px 0' }} />}
                                            </div>
                                            <div style={{ flex: 1, paddingBottom: isLast ? 0 : '16px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', backgroundColor: s.bg, color: s.text }}>{h.estado_asignado}</span>
                                                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{fmt(h.fecha)} {fmtH(h.fecha)}</span>
                                                </div>
                                                <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 2px 0' }}>{h.comentario}</p>
                                                {h.usuario_nombre && <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>👤 {h.usuario_nombre}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Botones editar / eliminar (solo si es reporte propio en Pendiente) */}
                        {editable && (
                            <div style={{ display: 'flex', gap: '10px', paddingBottom: '8px' }}>
                                <button
                                    onClick={() => navigate('/app/editar', { state: { id: detalle.id, titulo: detalle.titulo, descripcion: detalle.descripcion, categoria: detalle.categoria, foto: detalle.foto } })}
                                    style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #7C3AED', backgroundColor: '#F5F3FF', color: '#7C3AED', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                                >
                                    ✏️ Editar
                                </button>
                                <button
                                    onClick={() => setModalDel(true)}
                                    style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#FEE2E2', color: '#DC2626', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                                >
                                    🗑️ Eliminar
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal confirmar eliminación */}
            {modalDel && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '20px 20px 0 0', padding: '28px 20px', width: '100%', boxSizing: 'border-box' }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ fontSize: '44px', marginBottom: '8px' }}>🗑️</div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#DC2626', margin: '0 0 8px 0' }}>¿Eliminar reporte?</h3>
                            <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
                                "<strong>{detalle?.titulo}</strong>" desaparecerá del mapa y de tu lista.
                            </p>
                        </div>
                        {errDel && <p style={{ fontSize: '13px', color: '#EF4444', textAlign: 'center', marginBottom: '12px' }}>{errDel}</p>}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setModalDel(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', backgroundColor: '#fff', color: '#64748B', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                            <button onClick={eliminar} disabled={eliminando} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: eliminando ? '#FCA5A5' : '#DC2626', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: eliminando ? 'default' : 'pointer' }}>
                                {eliminando ? 'Eliminando…' : 'Sí, eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
