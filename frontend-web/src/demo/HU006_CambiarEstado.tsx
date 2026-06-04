// HU006 — Cambiar estado de reportes (API real)
// El backend envía email al ciudadano automáticamente
// Resultado esperado: "Estado actualizado y ciudadano notificado"
import React, { useState, useEffect } from 'react';
import DemoShell, { SuccessMessage, ErrorMessage, FormField, inputStyle, Card } from './DemoShell';
import { getSession } from './useSession';

type EstadoReporte = 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Rechazado';
const ESTADOS: EstadoReporte[] = ['Pendiente', 'En Proceso', 'Resuelto', 'Rechazado'];

const COLOR: Record<EstadoReporte, string> = { 'Pendiente':'#EF4444','En Proceso':'#F59E0B','Resuelto':'#22C55E','Rechazado':'#6B7280' };
const BG:    Record<EstadoReporte, string> = { 'Pendiente':'#FEE2E2','En Proceso':'#FEF3C7','Resuelto':'#DCFCE7','Rechazado':'#F3F4F6' };
const TEXT:  Record<EstadoReporte, string> = { 'Pendiente':'#B91C1C','En Proceso':'#D97706','Resuelto':'#15803D','Rechazado':'#4B5563' };

interface Reporte { id: string; codigo: string; titulo: string; estado: EstadoReporte; comuna: string; ciudadano?: string; }

export default function HU006_CambiarEstado() {
    const sesion = getSession();
    const [reportes,     setReportes]     = useState<Reporte[]>([]);
    const [cargando,     setCargando]     = useState(true);
    const [seleccionado, setSeleccionado] = useState<string | null>(null);
    const [nuevoEstado,  setNuevoEstado]  = useState<EstadoReporte>('En Proceso');
    const [comentario,   setComentario]   = useState('');
    const [enviando,     setEnviando]     = useState(false);
    const [error,        setError]        = useState('');
    const [resultado,    setResultado]    = useState('');

    const cargarReportes = async () => {
        if (!sesion) return;
        setCargando(true);
        try {
            const res  = await fetch(`/api/reports/?usuarioId=${sesion.uid}&usuarioRol=${sesion.rol}`, {
                headers: { Authorization: `Bearer ${sesion.token}` },
            });
            const data = await res.json();
            if (res.ok) setReportes(data.data || []);
        } catch { /* silencioso */ }
        finally { setCargando(false); }
    };

    useEffect(() => { cargarReportes(); }, []);

    const reporte = reportes.find(r => r.id === seleccionado);

    const handleActualizar = async () => {
        if (!reporte || !sesion) return;
        setEnviando(true);
        setError('');
        setResultado('');
        try {
            const res  = await fetch(`/api/reports/${reporte.id}/status`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sesion.token}` },
                body:    JSON.stringify({ nuevoEstado, comentario: comentario || undefined }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message || 'Error al actualizar.'); return; }

            setReportes(prev => prev.map(r => r.id === seleccionado ? { ...r, estado: nuevoEstado } : r));
            setResultado(`Estado cambiado de "${reporte.estado}" → "${nuevoEstado}"${comentario ? ` · Nota: "${comentario}"` : ''}`);
            setComentario('');
        } catch {
            setError('No se pudo conectar con el servidor.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <DemoShell huId="HU006" titulo="Cambiar Estado de Reportes" integrante="Alex" color="#DC2626">

            {/* Lista de reportes */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                        📋 Reportes del sistema {!cargando && `(${reportes.length})`}
                    </h3>
                    <button onClick={cargarReportes} style={{ fontSize: '12px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>↻ Actualizar</button>
                </div>

                {cargando ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Cargando reportes…</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                        {reportes.map(r => (
                            <div key={r.id} onClick={() => { setSeleccionado(r.id); setNuevoEstado(r.estado); setResultado(''); setError(''); }}
                                style={{ padding: '12px', borderRadius: '12px', cursor: 'pointer', border: `2px solid ${seleccionado === r.id ? '#DC2626' : '#F1F5F9'}`, backgroundColor: seleccionado === r.id ? '#FEF2F2' : '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px 0' }}>{r.titulo}</p>
                                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>{r.codigo} · {r.comuna}</p>
                                </div>
                                <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', backgroundColor: BG[r.estado], color: TEXT[r.estado], whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                    {r.estado}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Panel de cambio */}
            {reporte && (
                <Card>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '0 0 14px 0' }}>
                        ✏️ Actualizar: <span style={{ color: '#DC2626' }}>{reporte.titulo}</span>
                    </h3>

                    <FormField label="Nuevo estado">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {ESTADOS.map(e => (
                                <button key={e} onClick={() => setNuevoEstado(e)} style={{ padding: '10px', borderRadius: '10px', border: `2px solid ${nuevoEstado === e ? COLOR[e] : '#E5E7EB'}`, backgroundColor: nuevoEstado === e ? BG[e] : '#fff', color: nuevoEstado === e ? TEXT[e] : '#374151', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                                    {e}
                                </button>
                            ))}
                        </div>
                    </FormField>

                    <FormField label="Comentario interno (opcional)">
                        <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '72px' }} value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Notas para el equipo de administración…" />
                    </FormField>

                    {error    && <ErrorMessage mensaje={error} />}

                    <button onClick={handleActualizar} disabled={enviando || nuevoEstado === reporte.estado}
                        style={{ width: '100%', padding: '12px', backgroundColor: nuevoEstado === reporte.estado ? '#94a3b8' : '#DC2626', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: nuevoEstado === reporte.estado ? 'default' : 'pointer', marginTop: '8px' }}>
                        {enviando ? '⏳ Actualizando…' : nuevoEstado === reporte.estado ? 'Selecciona un estado diferente' : `Actualizar a "${nuevoEstado}" →`}
                    </button>

                    {resultado && (
                        <>
                            <div style={{ backgroundColor: '#F0FDF4', borderRadius: '10px', padding: '12px', marginTop: '12px', fontSize: '13px', color: '#15803D' }}>
                                🔔 Email enviado al ciudadano automáticamente<br/>
                                🗺️ Mapa actualizado<br/>
                                📝 {resultado}
                            </div>
                            <SuccessMessage mensaje="Estado actualizado y ciudadano notificado" />
                        </>
                    )}
                </Card>
            )}
        </DemoShell>
    );
}
