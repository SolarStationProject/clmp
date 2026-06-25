import { useState, useEffect } from 'react';
import { api } from '../../services/api';

const ESTADOS    = ['Pendiente', 'En Proceso', 'Resuelto', 'Rechazado'];
const CATEGORIAS = ['Escombros', 'Basura domiciliaria', 'Residuos domiciliarios', 'Residuos peligrosos', 'Residuos especiales', 'Chatarra', 'Otro'];
const PRIORIDADES = [
    { label: 'Baja',    color: '#94A3B8', bg: '#F1F5F9', desc: 'Sin urgencia'       },
    { label: 'Normal',  color: '#0EA5E9', bg: '#EFF6FF', desc: 'Atención estándar'  },
    { label: 'Alta',    color: '#F59E0B', bg: '#FFFBEB', desc: 'Atención pronta'    },
    { label: 'Crítica', color: '#EF4444', bg: '#FEF2F2', desc: 'Urgente'            },
];

const EST_COLOR: Record<string, { text: string; bg: string }> = {
    'Pendiente':  { text: '#B91C1C', bg: '#FEE2E2' },
    'En Proceso': { text: '#D97706', bg: '#FEF3C7' },
    'Resuelto':   { text: '#15803D', bg: '#DCFCE7' },
    'Rechazado':  { text: '#4B5563', bg: '#F3F4F6' },
};
const priColor = (p?: string) => PRIORIDADES.find(x => x.label === p)?.color || '#94A3B8';
const priBg    = (p?: string) => PRIORIDADES.find(x => x.label === p)?.bg    || '#F1F5F9';
const fmt = (s: string) => new Date(s).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

interface Reporte {
    id: string; codigo: string; titulo: string; estado: string; prioridad?: string;
    categoria: string; direccion: string; comuna: string; nombre?: string; fecha_creacion: string;
}

const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: '8px',
    border: '1px solid #E2E8F0', fontSize: '13px', backgroundColor: '#fff',
    boxSizing: 'border-box', fontFamily: 'inherit', color: '#1e293b',
};

export default function ReportesScreen() {
    // Filtros
    const [estado,     setEstado]     = useState('');
    const [prioridad,  setPrioridad]  = useState('');
    const [categoria,  setCategoria]  = useState('');
    const [comuna,     setComuna]     = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    // Datos
    const [reportes,   setReportes]   = useState<Reporte[]>([]);
    const [cargando,   setCargando]   = useState(true);
    const [error,      setError]      = useState('');

    // Panel lateral
    const [seleccionado, setSeleccionado] = useState<Reporte | null>(null);

    // Acciones en panel
    const [nuevoEstado,  setNuevoEstado]  = useState('');
    const [comentario,   setComentario]   = useState('');
    const [nuevaPri,     setNuevaPri]     = useState('');
    const [guardandoEst, setGuardandoEst] = useState(false);
    const [guardandoPri, setGuardandoPri] = useState(false);
    const [msgEst,       setMsgEst]       = useState('');
    const [msgPri,       setMsgPri]       = useState('');
    const [errEst,       setErrEst]       = useState('');
    const [errPri,       setErrPri]       = useState('');

    const buscar = async () => {
        setCargando(true); setError('');
        const params = new URLSearchParams();
        if (estado)     params.set('estado',     estado);
        if (prioridad)  params.set('prioridad',  prioridad);
        if (categoria)  params.set('categoria',  categoria);
        if (comuna)     params.set('comuna',     comuna);
        if (fechaDesde) params.set('fechaDesde', fechaDesde);
        if (fechaHasta) params.set('fechaHasta', fechaHasta);
        try {
            const r = await api.get<{ data: Reporte[] }>(`/api/reports/filtrar?${params}`);
            setReportes(r.data.data || []);
        } catch { setError('Error al cargar reportes.'); }
        finally  { setCargando(false); }
    };

    useEffect(() => { buscar(); }, []);

    const limpiar = () => {
        setEstado(''); setPrioridad(''); setCategoria('');
        setComuna(''); setFechaDesde(''); setFechaHasta('');
        setSeleccionado(null);
    };

    const seleccionar = (r: Reporte) => {
        setSeleccionado(r);
        setNuevoEstado(r.estado);
        setNuevaPri(r.prioridad || 'Normal');
        setMsgEst(''); setMsgPri(''); setErrEst(''); setErrPri(''); setComentario('');
    };

    const cambiarEstado = async () => {
        if (!seleccionado || nuevoEstado === seleccionado.estado) return;
        setGuardandoEst(true); setErrEst(''); setMsgEst('');
        try {
            await api.put(`/api/reports/${seleccionado.id}/status`, { nuevoEstado, comentario: comentario || undefined });
            setReportes(prev => prev.map(r => r.id === seleccionado.id ? { ...r, estado: nuevoEstado } : r));
            setSeleccionado(s => s ? { ...s, estado: nuevoEstado } : null);
            setMsgEst(`Estado actualizado a "${nuevoEstado}". Email enviado al ciudadano.`);
            setComentario('');
        } catch (e: any) { setErrEst(e?.response?.data?.message || 'Error al actualizar.'); }
        finally { setGuardandoEst(false); }
    };

    const cambiarPrioridad = async () => {
        if (!seleccionado) return;
        setGuardandoPri(true); setErrPri(''); setMsgPri('');
        try {
            await api.put(`/api/reports/${seleccionado.id}/prioridad`, { prioridad: nuevaPri });
            setReportes(prev => prev.map(r => r.id === seleccionado.id ? { ...r, prioridad: nuevaPri } : r));
            setSeleccionado(s => s ? { ...s, prioridad: nuevaPri } : null);
            setMsgPri(`Prioridad actualizada a "${nuevaPri}".`);
        } catch (e: any) { setErrPri(e?.response?.data?.message || 'Error al actualizar.'); }
        finally { setGuardandoPri(false); }
    };

    return (
        <div style={{ display: 'flex', gap: '20px', height: '100%', minHeight: 0 }}>

            {/* ── Panel de filtros ── */}
            <aside style={{ width: '240px', flexShrink: 0, backgroundColor: '#fff', borderRadius: '14px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '14px', alignSelf: 'flex-start' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: 0 }}>Filtros</p>

                {/* Estado */}
                <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Estado</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {ESTADOS.map(e => {
                            const s = EST_COLOR[e];
                            return (
                                <button key={e} onClick={() => setEstado(estado === e ? '' : e)} style={{
                                    padding: '6px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textAlign: 'left',
                                    backgroundColor: estado === e ? s.bg : '#F8FAFC',
                                    color: estado === e ? s.text : '#64748B',
                                    outline: estado === e ? `1.5px solid ${s.text}` : 'none',
                                }}>{e}</button>
                            );
                        })}
                    </div>
                </div>

                {/* Prioridad */}
                <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Prioridad</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {PRIORIDADES.map(p => (
                            <button key={p.label} onClick={() => setPrioridad(prioridad === p.label ? '' : p.label)} style={{
                                padding: '6px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textAlign: 'left',
                                backgroundColor: prioridad === p.label ? p.bg : '#F8FAFC',
                                color: prioridad === p.label ? p.color : '#64748B',
                                outline: prioridad === p.label ? `1.5px solid ${p.color}` : 'none',
                            }}>{p.label}</button>
                        ))}
                    </div>
                </div>

                {/* Categoría */}
                <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Categoría</label>
                    <select style={inp} value={categoria} onChange={e => setCategoria(e.target.value)}>
                        <option value="">Todas</option>
                        {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Comuna */}
                <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Comuna</label>
                    <input style={inp} value={comuna} onChange={e => setComuna(e.target.value)} placeholder="Ej: Providencia" />
                </div>

                {/* Fechas */}
                <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Período</label>
                    <input style={{ ...inp, marginBottom: '6px' }} type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
                    <input style={inp} type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button onClick={buscar} disabled={cargando} style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: cargando ? '#94A3B8' : '#005c2e', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                        {cargando ? 'Buscando…' : 'Buscar'}
                    </button>
                    <button onClick={() => { limpiar(); setTimeout(buscar, 0); }} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#fff', color: '#64748B', fontSize: '12px', cursor: 'pointer' }}>
                        Limpiar filtros
                    </button>
                </div>
            </aside>

            {/* ── Tabla de resultados ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
                        {cargando ? 'Cargando…' : `${reportes.length} reporte${reportes.length !== 1 ? 's' : ''}`}
                    </p>
                    <button onClick={buscar} style={{ fontSize: '12px', color: '#005c2e', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>↻ Actualizar</button>
                </div>

                {error && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#DC2626' }}>{error}</div>}

                <div style={{ backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                    {/* Header tabla */}
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 110px 90px 130px 110px 100px', gap: '0', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '10px 16px' }}>
                        {['Código', 'Título', 'Estado', 'Prioridad', 'Categoría', 'Comuna', 'Fecha'].map(h => (
                            <span key={h} style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                        ))}
                    </div>

                    {/* Filas */}
                    <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                        {!cargando && reportes.length === 0 && (
                            <p style={{ textAlign: 'center', color: '#94A3B8', padding: '40px', fontSize: '14px' }}>Sin resultados para los filtros aplicados.</p>
                        )}
                        {reportes.map(r => {
                            const es = EST_COLOR[r.estado] || EST_COLOR['Pendiente'];
                            const active = seleccionado?.id === r.id;
                            return (
                                <div key={r.id} onClick={() => seleccionar(r)} style={{
                                    display: 'grid', gridTemplateColumns: '110px 1fr 110px 90px 130px 110px 100px',
                                    gap: '0', padding: '12px 16px', borderBottom: '1px solid #F1F5F9',
                                    cursor: 'pointer', alignItems: 'center',
                                    backgroundColor: active ? '#F0FDF4' : 'transparent',
                                    transition: 'background-color 0.1s',
                                }}>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', fontFamily: 'monospace' }}>{r.codigo}</span>
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{r.titulo}</span>
                                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '8px', backgroundColor: es.bg, color: es.text, display: 'inline-block', textAlign: 'center' }}>{r.estado}</span>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: priColor(r.prioridad) }}>{r.prioridad || 'Normal'}</span>
                                    <span style={{ fontSize: '12px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.categoria}</span>
                                    <span style={{ fontSize: '12px', color: '#475569' }}>{r.comuna}</span>
                                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{fmt(r.fecha_creacion)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Panel de acciones (se abre al seleccionar fila) ── */}
            {seleccionado && (
                <aside style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '14px', alignSelf: 'flex-start' }}>

                    {/* Info del reporte */}
                    <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', fontFamily: 'monospace' }}>{seleccionado.codigo}</span>
                            <button onClick={() => setSeleccionado(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B', margin: '0 0 6px' }}>{seleccionado.titulo}</p>
                        <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 2px' }}>📍 {seleccionado.direccion}, {seleccionado.comuna}</p>
                        <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>📅 {fmt(seleccionado.fecha_creacion)}</p>
                    </div>

                    {/* Cambiar estado */}
                    <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: '0 0 12px' }}>Cambiar estado</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                            {ESTADOS.map(e => {
                                const s = EST_COLOR[e];
                                return (
                                    <button key={e} onClick={() => setNuevoEstado(e)} style={{
                                        padding: '9px 6px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', border: 'none',
                                        backgroundColor: nuevoEstado === e ? s.bg : '#F8FAFC',
                                        color: nuevoEstado === e ? s.text : '#64748B',
                                        outline: nuevoEstado === e ? `2px solid ${s.text}` : 'none',
                                    }}>{e}</button>
                                );
                            })}
                        </div>
                        <textarea style={{ ...inp, resize: 'vertical', minHeight: '64px', marginBottom: '8px' }}
                            value={comentario} onChange={e => setComentario(e.target.value)}
                            placeholder="Comentario interno (opcional)…" />
                        {errEst && <p style={{ fontSize: '12px', color: '#EF4444', margin: '0 0 8px' }}>{errEst}</p>}
                        {msgEst && <p style={{ fontSize: '12px', color: '#16A34A', margin: '0 0 8px' }}>✅ {msgEst}</p>}
                        <button onClick={cambiarEstado} disabled={guardandoEst || nuevoEstado === seleccionado.estado} style={{
                            width: '100%', padding: '10px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '700',
                            backgroundColor: guardandoEst || nuevoEstado === seleccionado.estado ? '#94A3B8' : '#005c2e',
                            color: '#fff', cursor: guardandoEst || nuevoEstado === seleccionado.estado ? 'default' : 'pointer',
                        }}>
                            {guardandoEst ? 'Guardando…' : `Actualizar a "${nuevoEstado}"`}
                        </button>
                    </div>

                    {/* Asignar prioridad */}
                    <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: '0 0 12px' }}>Asignar prioridad</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                            {PRIORIDADES.map(p => (
                                <button key={p.label} onClick={() => setNuevaPri(p.label)} style={{
                                    padding: '9px 6px', borderRadius: '8px', cursor: 'pointer', border: 'none', textAlign: 'left',
                                    backgroundColor: nuevaPri === p.label ? p.bg : '#F8FAFC',
                                    outline: nuevaPri === p.label ? `2px solid ${p.color}` : 'none',
                                }}>
                                    <p style={{ fontSize: '12px', fontWeight: '700', color: p.color, margin: '0 0 1px' }}>{p.label}</p>
                                    <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>{p.desc}</p>
                                </button>
                            ))}
                        </div>
                        {errPri && <p style={{ fontSize: '12px', color: '#EF4444', margin: '0 0 8px' }}>{errPri}</p>}
                        {msgPri && <p style={{ fontSize: '12px', color: '#16A34A', margin: '0 0 8px' }}>✅ {msgPri}</p>}
                        <button onClick={cambiarPrioridad} disabled={guardandoPri} style={{
                            width: '100%', padding: '10px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '700',
                            backgroundColor: guardandoPri ? '#94A3B8' : '#D97706', color: '#fff', cursor: guardandoPri ? 'default' : 'pointer',
                        }}>
                            {guardandoPri ? 'Guardando…' : `Asignar "${nuevaPri}"`}
                        </button>
                    </div>
                </aside>
            )}
        </div>
    );
}
