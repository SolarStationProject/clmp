// HU023 — Historial paginado de reportes del ciudadano
import { useState, useEffect } from 'react';
import DemoShell, { Card } from './DemoShell';
import { getSession, API_BASE } from './useSession';

type EstadoReporte = 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Rechazado';
type FiltroVista   = 'todos' | 'activos' | 'resueltos' | 'eliminados';
type OrdenVista    = 'fecha_desc' | 'fecha_asc' | 'estado';

const COLOR: Record<string, string> = { Pendiente:'#EF4444','En Proceso':'#F59E0B',Resuelto:'#22C55E',Rechazado:'#6B7280',eliminado:'#94A3B8' };
const BG:    Record<string, string> = { Pendiente:'#FEE2E2','En Proceso':'#FEF3C7',Resuelto:'#DCFCE7',Rechazado:'#F3F4F6',eliminado:'#F1F5F9' };

const POR_PAGINA = 20;

interface Reporte {
    id: string; codigo: string; titulo: string; descripcion: string;
    estado: EstadoReporte; categoria: string; foto?: string;
    fecha_creacion: string; direccion: string; comuna: string;
    eliminado?: boolean;
}

const fmt = (s: string) => new Date(s).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

export default function HU023_HistorialReportes() {
    const sesion = getSession();
    const [todos,    setTodos]    = useState<Reporte[]>([]);
    const [cargando, setCargando] = useState(true);
    const [filtro,   setFiltro]   = useState<FiltroVista>('activos');
    const [orden,    setOrden]    = useState<OrdenVista>('fecha_desc');
    const [pagina,   setPagina]   = useState(1);
    const [detalle,  setDetalle]  = useState<Reporte | null>(null);

    useEffect(() => {
        if (!sesion) return;
        setCargando(true);
        fetch(`${API_BASE}/api/reports/my-reports?ciudadanoId=${sesion.uid}&incluirEliminados=true`, {
            headers: { Authorization: `Bearer ${sesion.token}` },
        })
            .then(r => r.json())
            .then(d => setTodos(d.data || []))
            .finally(() => setCargando(false));
    }, []);

    const filtrados = todos.filter(r => {
        if (filtro === 'activos')    return !r.eliminado && r.estado !== 'Resuelto';
        if (filtro === 'resueltos')  return !r.eliminado && r.estado === 'Resuelto';
        if (filtro === 'eliminados') return r.eliminado;
        return true;
    });

    const ordenados = [...filtrados].sort((a, b) => {
        if (orden === 'fecha_asc')  return new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime();
        if (orden === 'estado')     return a.estado.localeCompare(b.estado);
        return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
    });

    const totalPaginas = Math.max(1, Math.ceil(ordenados.length / POR_PAGINA));
    const paginados    = ordenados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

    const FILTROS: { key: FiltroVista; label: string }[] = [
        { key: 'activos',    label: 'Activos'    },
        { key: 'resueltos',  label: 'Resueltos'  },
        { key: 'eliminados', label: 'Eliminados' },
        { key: 'todos',      label: 'Todos'      },
    ];

    return (
        <DemoShell huId="HU023" titulo="Historial de Reportes" integrante="Julián" color="#0284C7">

            {/* Controles */}
            <Card>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {FILTROS.map(f => (
                        <button key={f.key} onClick={() => { setFiltro(f.key); setPagina(1); }} style={{
                            padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                            backgroundColor: filtro === f.key ? '#0284C7' : '#F1F5F9',
                            color: filtro === f.key ? '#fff' : '#64748b',
                        }}>{f.label}</button>
                    ))}
                    <select value={orden} onChange={e => { setOrden(e.target.value as OrdenVista); setPagina(1); }} style={{
                        marginLeft: 'auto', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E2E8F0',
                        fontSize: '13px', color: '#374151', backgroundColor: '#fff',
                    }}>
                        <option value="fecha_desc">Más reciente primero</option>
                        <option value="fecha_asc">Más antiguo primero</option>
                        <option value="estado">Por estado</option>
                    </select>
                </div>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                    {ordenados.length} reporte{ordenados.length !== 1 ? 's' : ''} · página {pagina} de {totalPaginas}
                </p>
            </Card>

            {/* Lista */}
            <Card>
                {cargando ? (
                    <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>Cargando historial…</p>
                ) : paginados.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>No hay reportes en esta categoría.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {paginados.map(r => {
                            const clave = r.eliminado ? 'eliminado' : r.estado;
                            return (
                                <div key={r.id} onClick={() => setDetalle(detalle?.id === r.id ? null : r)}
                                    style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', cursor: 'pointer',
                                        backgroundColor: detalle?.id === r.id ? BG[clave] : '#F8FAFC',
                                        border: `1px solid ${detalle?.id === r.id ? COLOR[clave] : '#E2E8F0'}` }}>

                                    {/* Thumbnail */}
                                    <div style={{ width: '56px', height: '56px', borderRadius: '10px', flexShrink: 0, overflow: 'hidden',
                                        backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {r.foto
                                            ? <img src={r.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <span style={{ fontSize: '22px' }}>📋</span>}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: 0,
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titulo}</p>
                                            <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '8px', flexShrink: 0,
                                                backgroundColor: BG[clave], color: COLOR[clave] }}>
                                                {r.eliminado ? 'Eliminado' : r.estado}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0' }}>
                                            {r.codigo} · {r.categoria} · {fmt(r.fecha_creacion)}
                                        </p>
                                        {r.eliminado && (
                                            <p style={{ fontSize: '11px', color: '#EF4444', margin: '2px 0 0' }}>🗑 Eliminado por el ciudadano</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Detalle expandido */}
            {detalle && (
                <Card>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: '0 0 12px' }}>Detalle del reporte</h3>
                    {detalle.foto && (
                        <img src={detalle.foto} alt="foto" style={{ width: '100%', borderRadius: '10px', marginBottom: '10px', objectFit: 'cover', maxHeight: '160px' }} />
                    )}
                    <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 6px' }}><strong>Descripción:</strong> {detalle.descripcion}</p>
                    <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 6px' }}><strong>Dirección:</strong> {detalle.direccion}, {detalle.comuna}</p>
                    <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}><strong>Creado:</strong> {fmt(detalle.fecha_creacion)}</p>
                </Card>
            )}

            {/* Paginación */}
            {totalPaginas > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                        style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'pointer',
                            backgroundColor: pagina === 1 ? '#F8FAFC' : '#fff', color: '#374151', fontSize: '13px' }}>
                        ← Anterior
                    </button>
                    <span style={{ padding: '8px 12px', fontSize: '13px', color: '#64748B' }}>{pagina} / {totalPaginas}</span>
                    <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                        style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'pointer',
                            backgroundColor: pagina === totalPaginas ? '#F8FAFC' : '#fff', color: '#374151', fontSize: '13px' }}>
                        Siguiente →
                    </button>
                </div>
            )}
        </DemoShell>
    );
}
