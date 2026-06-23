// HU020 — Eliminar reporte (soft delete, solo estado Pendiente)
import { useState, useEffect } from 'react';
import DemoShell, { SuccessMessage, Card } from './DemoShell';
import { getSession, API_BASE } from './useSession';

type EstadoReporte = 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Rechazado';

interface Reporte {
    id: string; codigo: string; titulo: string; descripcion: string;
    estado: EstadoReporte; categoria: string; foto?: string;
    fecha_creacion: string; direccion: string;
}

const fmt = (s: string) => new Date(s).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

export default function HU020_EliminarReporte() {
    const sesion = getSession();
    const [reportes,     setReportes]     = useState<Reporte[]>([]);
    const [cargando,     setCargando]     = useState(true);
    const [seleccionado, setSeleccionado] = useState<Reporte | null>(null);
    const [confirmando,  setConfirmando]  = useState(false);
    const [eliminando,   setEliminando]   = useState(false);
    const [exito,        setExito]        = useState(false);
    const [error,        setError]        = useState('');

    const cargar = () => {
        if (!sesion) return;
        setCargando(true);
        fetch(`${API_BASE}/api/reports/my-reports?ciudadanoId=${sesion.uid}`, {
            headers: { Authorization: `Bearer ${sesion.token}` },
        })
            .then(r => r.json())
            .then(d => setReportes((d.data || []).filter((r: Reporte) => r.estado === 'Pendiente')))
            .finally(() => setCargando(false));
    };

    useEffect(() => { cargar(); }, []);

    const seleccionar = (r: Reporte) => {
        setSeleccionado(r);
        setConfirmando(false);
        setExito(false);
        setError('');
    };

    const confirmarEliminar = async () => {
        if (!seleccionado || !sesion) return;
        setEliminando(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/api/reports/${seleccionado.id}`, {
                method:  'DELETE',
                headers: { Authorization: `Bearer ${sesion.token}` },
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message || 'Error al eliminar.'); return; }
            setExito(true);
            setConfirmando(false);
            setReportes(prev => prev.filter(r => r.id !== seleccionado.id));
            setSeleccionado(null);
        } catch {
            setError('Error de conexión.');
        } finally {
            setEliminando(false);
        }
    };

    return (
        <DemoShell huId="HU020" titulo="Eliminar Reporte" integrante="Julián" color="#DC2626">

            {exito && <SuccessMessage mensaje="Reporte eliminado. Ya no aparece en el mapa ni en tu lista activa." />}

            {/* Aviso importante */}
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 14px' }}>
                <p style={{ fontSize: '13px', color: '#991B1B', margin: 0, fontWeight: '600' }}>
                    ⚠️ Solo puedes eliminar reportes en estado <strong>Pendiente</strong>. Reportes ya procesados no se pueden eliminar.
                </p>
                <p style={{ fontSize: '12px', color: '#B91C1C', margin: '6px 0 0' }}>
                    La eliminación es lógica (soft delete): el reporte se oculta del mapa y de tu lista, pero los datos se conservan internamente.
                </p>
            </div>

            {/* Lista de reportes eliminables */}
            <Card>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: '0 0 10px' }}>
                    Mis reportes en estado Pendiente
                </h3>
                {cargando ? (
                    <p style={{ fontSize: '13px', color: '#94A3B8' }}>Cargando…</p>
                ) : reportes.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#94A3B8' }}>No tienes reportes en estado Pendiente disponibles para eliminar.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                        {reportes.map(r => (
                            <div key={r.id} onClick={() => seleccionar(r)} style={{
                                display: 'flex', gap: '10px', alignItems: 'center',
                                padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                                border: `2px solid ${seleccionado?.id === r.id ? '#DC2626' : '#E2E8F0'}`,
                                backgroundColor: seleccionado?.id === r.id ? '#FEF2F2' : '#F8FAFC',
                            }}>
                                {r.foto
                                    ? <img src={r.foto} alt="" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                                    : <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px' }}>📋</div>
                                }
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titulo}</p>
                                    <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>{r.codigo} · {fmt(r.fecha_creacion)}</p>
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#B91C1C', flexShrink: 0 }}>Pendiente</span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Panel de confirmación */}
            {seleccionado && !confirmando && !exito && (
                <Card>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: '0 0 10px' }}>
                        Reporte seleccionado
                    </h3>
                    <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 6px' }}><strong>{seleccionado.titulo}</strong></p>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 14px' }}>{seleccionado.descripcion}</p>
                    <button onClick={() => setConfirmando(true)} style={{
                        width: '100%', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        backgroundColor: '#DC2626', color: '#fff', fontWeight: '700', fontSize: '14px',
                    }}>
                        🗑 Eliminar este reporte
                    </button>
                </Card>
            )}

            {/* Confirmación final */}
            {confirmando && seleccionado && (
                <Card>
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#DC2626', margin: '0 0 8px' }}>¿Confirmas la eliminación?</h3>
                        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 20px' }}>
                            "<strong>{seleccionado.titulo}</strong>" desaparecerá del mapa y de tu lista activa.
                        </p>
                        {error && <p style={{ fontSize: '13px', color: '#EF4444', marginBottom: '12px' }}>{error}</p>}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setConfirmando(false)} style={{
                                flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0',
                                cursor: 'pointer', backgroundColor: '#F8FAFC', color: '#374151', fontWeight: '600', fontSize: '14px',
                            }}>Cancelar</button>
                            <button onClick={confirmarEliminar} disabled={eliminando} style={{
                                flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                                cursor: eliminando ? 'not-allowed' : 'pointer',
                                backgroundColor: eliminando ? '#FCA5A5' : '#DC2626', color: '#fff', fontWeight: '700', fontSize: '14px',
                            }}>
                                {eliminando ? 'Eliminando…' : 'Sí, eliminar'}
                            </button>
                        </div>
                    </div>
                </Card>
            )}
        </DemoShell>
    );
}
