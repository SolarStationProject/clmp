// HU014 — Filtrar reportes por estado, categoría, comuna, fecha, prioridad (solo Admin)
import { useState } from 'react';
import DemoShell, { Card } from './DemoShell';
import { getSession, API_BASE } from './useSession';

const ESTADOS    = ['Pendiente', 'En Proceso', 'Resuelto', 'Rechazado'];
const CATEGORIAS = ['Escombros', 'Basura domiciliaria', 'Residuos domiciliarios', 'Residuos peligrosos', 'Residuos especiales', 'Chatarra', 'Otro'];
const PRIORIDADES = ['Baja', 'Normal', 'Alta', 'Crítica'];
const COLOR_EST: Record<string, string> = { Pendiente:'#EF4444','En Proceso':'#F59E0B',Resuelto:'#22C55E',Rechazado:'#6B7280' };
const BG_EST:    Record<string, string> = { Pendiente:'#FEE2E2','En Proceso':'#FEF3C7',Resuelto:'#DCFCE7',Rechazado:'#F3F4F6' };
const COLOR_PRI: Record<string, string> = { Baja:'#94A3B8',Normal:'#0EA5E9',Alta:'#F59E0B','Crítica':'#EF4444' };

interface Reporte {
    id: string; codigo: string; titulo: string; categoria: string; estado: string;
    prioridad: string; direccion: string; comuna: string; nombre: string; fecha_creacion: string;
}

const fmt = (s: string) => new Date(s).toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' });

export default function HU014_FiltrarReportes() {
    const sesion = getSession();
    const [estado,     setEstado]     = useState('');
    const [categoria,  setCategoria]  = useState('');
    const [comuna,     setComuna]     = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [prioridad,  setPrioridad]  = useState('');
    const [reportes,   setReportes]   = useState<Reporte[] | null>(null);
    const [cargando,   setCargando]   = useState(false);
    const [error,      setError]      = useState('');

    const buscar = async () => {
        if (!sesion) return;
        setCargando(true);
        setError('');
        const params = new URLSearchParams();
        if (estado)     params.set('estado',     estado);
        if (categoria)  params.set('categoria',  categoria);
        if (comuna)     params.set('comuna',     comuna);
        if (fechaDesde) params.set('fechaDesde', fechaDesde);
        if (fechaHasta) params.set('fechaHasta', fechaHasta);
        if (prioridad)  params.set('prioridad',  prioridad);
        try {
            const res = await fetch(`${API_BASE}/api/reports/filtrar?${params}`, {
                headers: { Authorization: `Bearer ${sesion.token}` },
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message); return; }
            setReportes(data.data);
        } catch {
            setError('Error de conexión.');
        } finally {
            setCargando(false);
        }
    };

    const limpiar = () => {
        setEstado(''); setCategoria(''); setComuna('');
        setFechaDesde(''); setFechaHasta(''); setPrioridad('');
        setReportes(null); setError('');
    };

    const sel = (v: string, set: (s: string) => void, current: string) =>
        set(current === v ? '' : v);

    return (
        <DemoShell huId="HU014" titulo="Filtrar Reportes" integrante="Martín" color="#0369A1">

            {/* Filtros */}
            <Card>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: '0 0 14px' }}>Filtros</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Estado */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>Estado</label>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {ESTADOS.map(e => (
                                <button key={e} onClick={() => sel(e, setEstado, estado)} style={{
                                    padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                                    backgroundColor: estado === e ? COLOR_EST[e] : BG_EST[e],
                                    color: estado === e ? '#fff' : COLOR_EST[e],
                                }}>{e}</button>
                            ))}
                        </div>
                    </div>

                    {/* Prioridad */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>Prioridad</label>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {PRIORIDADES.map(p => (
                                <button key={p} onClick={() => sel(p, setPrioridad, prioridad)} style={{
                                    padding: '5px 12px', borderRadius: '20px', border: `1px solid ${COLOR_PRI[p]}`, cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                                    backgroundColor: prioridad === p ? COLOR_PRI[p] : '#fff',
                                    color: prioridad === p ? '#fff' : COLOR_PRI[p],
                                }}>{p}</button>
                            ))}
                        </div>
                    </div>

                    {/* Categoría */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Categoría</label>
                        <select value={categoria} onChange={e => setCategoria(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', backgroundColor: '#fff' }}>
                            <option value="">Todas las categorías</option>
                            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Comuna */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Comuna (texto)</label>
                        <input value={comuna} onChange={e => setComuna(e.target.value)} placeholder="Ej: Providencia"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>

                    {/* Fechas */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Desde</label>
                            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                                style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Hasta</label>
                            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                                style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', boxSizing: 'border-box' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={buscar} disabled={cargando} style={{
                            flex: 3, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                            backgroundColor: cargando ? '#94A3B8' : '#0369A1', color: '#fff', fontWeight: '700', fontSize: '14px',
                        }}>{cargando ? 'Buscando…' : 'Buscar reportes'}</button>
                        <button onClick={limpiar} style={{
                            flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', cursor: 'pointer',
                            backgroundColor: '#F8FAFC', color: '#64748B', fontWeight: '600', fontSize: '13px',
                        }}>Limpiar</button>
                    </div>
                    {error && <p style={{ fontSize: '13px', color: '#EF4444', margin: 0 }}>{error}</p>}
                </div>
            </Card>

            {/* Resultados */}
            {reportes !== null && (
                <Card>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: '0 0 12px' }}>
                        {reportes.length} resultado{reportes.length !== 1 ? 's' : ''}
                    </p>
                    {reportes.length === 0 ? (
                        <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center' }}>Sin resultados para los filtros seleccionados.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
                            {reportes.map(r => (
                                <div key={r.id} style={{ padding: '11px 13px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titulo}</p>
                                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                            <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '6px', backgroundColor: BG_EST[r.estado], color: COLOR_EST[r.estado] }}>{r.estado}</span>
                                            <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '6px', backgroundColor: '#F1F5F9', color: COLOR_PRI[r.prioridad] || '#64748B' }}>{r.prioridad || 'Normal'}</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>{r.codigo} · {r.categoria} · {r.comuna} · {fmt(r.fecha_creacion)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}
        </DemoShell>
    );
}
