// HU015 — Asignar prioridad a reportes (solo Administrador)
import { useState, useEffect } from 'react';
import DemoShell, { SuccessMessage, Card } from './DemoShell';
import { getSession, API_BASE } from './useSession';

const PRIORIDADES = [
    { label: 'Baja',    color: '#94A3B8', bg: '#F1F5F9', desc: 'Sin urgencia inmediata' },
    { label: 'Normal',  color: '#0EA5E9', bg: '#EFF6FF', desc: 'Atención estándar'      },
    { label: 'Alta',    color: '#F59E0B', bg: '#FFFBEB', desc: 'Requiere atención pronta' },
    { label: 'Crítica', color: '#EF4444', bg: '#FEF2F2', desc: 'Riesgo ambiental urgente' },
];

interface Reporte {
    id: string; codigo: string; titulo: string; estado: string; categoria: string;
    fecha_creacion: string; prioridad?: string;
}

const fmt = (s: string) => new Date(s).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

export default function HU015_AsignarPrioridad() {
    const sesion = getSession();
    const [reportes,     setReportes]     = useState<Reporte[]>([]);
    const [cargando,     setCargando]     = useState(true);
    const [seleccionado, setSeleccionado] = useState<Reporte | null>(null);
    const [prioridad,    setPrioridad]    = useState('');
    const [guardando,    setGuardando]    = useState(false);
    const [exito,        setExito]        = useState(false);
    const [error,        setError]        = useState('');

    const cargar = () => {
        if (!sesion) return;
        fetch(`${API_BASE}/api/reports/filtrar`, {
            headers: { Authorization: `Bearer ${sesion.token}` },
        })
            .then(r => r.json())
            .then(d => setReportes(d.data || []))
            .finally(() => setCargando(false));
    };

    useEffect(() => { cargar(); }, []);

    const seleccionar = (r: Reporte) => {
        setSeleccionado(r);
        setPrioridad(r.prioridad || 'Normal');
        setExito(false);
        setError('');
    };

    const guardar = async () => {
        if (!seleccionado || !prioridad || !sesion) return;
        setGuardando(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/api/reports/${seleccionado.id}/prioridad`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sesion.token}` },
                body:    JSON.stringify({ prioridad }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message || 'Error.'); return; }
            setExito(true);
            setReportes(prev => prev.map(r => r.id === seleccionado.id ? { ...r, prioridad } : r));
            setSeleccionado(null);
        } catch {
            setError('Error de conexión.');
        } finally {
            setGuardando(false);
        }
    };

    const getPriColor = (p?: string) => PRIORIDADES.find(x => x.label === p)?.color || '#94A3B8';
    const getPriBg    = (p?: string) => PRIORIDADES.find(x => x.label === p)?.bg    || '#F1F5F9';

    return (
        <DemoShell huId="HU015" titulo="Asignar Prioridad" integrante="Martín" color="#D97706">

            {exito && <SuccessMessage mensaje={`Prioridad actualizada a "${prioridad}" correctamente.`} />}

            {/* Leyenda */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {PRIORIDADES.map(p => (
                    <div key={p.label} style={{ backgroundColor: p.bg, border: `1px solid ${p.color}40`, borderRadius: '10px', padding: '10px 12px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: p.color, margin: '0 0 2px' }}>{p.label}</p>
                        <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>{p.desc}</p>
                    </div>
                ))}
            </div>

            {/* Lista de reportes */}
            <Card>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: '0 0 10px' }}>
                    Seleccionar reporte
                </h3>
                {cargando ? (
                    <p style={{ fontSize: '13px', color: '#94A3B8' }}>Cargando…</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', maxHeight: '260px', overflowY: 'auto' }}>
                        {reportes.map(r => (
                            <div key={r.id} onClick={() => seleccionar(r)} style={{
                                display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                                border: `2px solid ${seleccionado?.id === r.id ? '#D97706' : '#E2E8F0'}`,
                                backgroundColor: seleccionado?.id === r.id ? '#FFFBEB' : '#F8FAFC',
                            }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titulo}</p>
                                    <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>{r.codigo} · {fmt(r.fecha_creacion)}</p>
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '8px', flexShrink: 0,
                                    backgroundColor: getPriBg(r.prioridad), color: getPriColor(r.prioridad) }}>
                                    {r.prioridad || 'Normal'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Panel asignación */}
            {seleccionado && (
                <Card>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#D97706', margin: '0 0 14px' }}>
                        Asignar prioridad: {seleccionado.codigo}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                        {PRIORIDADES.map(p => (
                            <button key={p.label} onClick={() => setPrioridad(p.label)} style={{
                                padding: '12px', borderRadius: '10px', cursor: 'pointer',
                                border: `2px solid ${prioridad === p.label ? p.color : '#E2E8F0'}`,
                                backgroundColor: prioridad === p.label ? p.bg : '#F8FAFC',
                                textAlign: 'left',
                            }}>
                                <p style={{ fontSize: '13px', fontWeight: '700', color: p.color, margin: '0 0 2px' }}>{p.label}</p>
                                <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>{p.desc}</p>
                            </button>
                        ))}
                    </div>
                    {error && <p style={{ fontSize: '13px', color: '#EF4444', margin: '0 0 10px' }}>{error}</p>}
                    <button onClick={guardar} disabled={guardando} style={{
                        width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                        cursor: guardando ? 'not-allowed' : 'pointer',
                        backgroundColor: guardando ? '#FCD34D' : '#D97706', color: '#fff', fontWeight: '700', fontSize: '14px',
                    }}>
                        {guardando ? 'Guardando…' : `Asignar prioridad "${prioridad}"`}
                    </button>
                </Card>
            )}
        </DemoShell>
    );
}
