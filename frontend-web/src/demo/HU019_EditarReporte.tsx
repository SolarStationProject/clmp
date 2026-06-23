// HU019 — Editar reporte en estado Pendiente
import { useState, useEffect } from 'react';
import DemoShell, { SuccessMessage, Card } from './DemoShell';
import { getSession, API_BASE } from './useSession';

type EstadoReporte = 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Rechazado';

const CATEGORIAS = ['Escombros', 'Basura domiciliaria', 'Residuos peligrosos', 'Chatarra', 'Otro'];

interface Reporte {
    id: string; codigo: string; titulo: string; descripcion: string;
    estado: EstadoReporte; categoria: string; foto?: string;
    fecha_creacion: string; direccion: string; comuna: string;
    eliminado?: boolean;
}

export default function HU019_EditarReporte() {
    const sesion = getSession();
    const [reportes,      setReportes]      = useState<Reporte[]>([]);
    const [cargando,      setCargando]      = useState(true);
    const [seleccionado,  setSeleccionado]  = useState<Reporte | null>(null);
    const [titulo,        setTitulo]        = useState('');
    const [descripcion,   setDescripcion]   = useState('');
    const [categoria,     setCategoria]     = useState('');
    const [fotoPreview,   setFotoPreview]   = useState<string>('');
    const [guardando,     setGuardando]     = useState(false);
    const [exito,         setExito]         = useState(false);
    const [error,         setError]         = useState('');

    useEffect(() => {
        if (!sesion) return;
        fetch(`${API_BASE}/api/reports/my-reports?ciudadanoId=${sesion.uid}`, {
            headers: { Authorization: `Bearer ${sesion.token}` },
        })
            .then(r => r.json())
            .then(d => setReportes((d.data || []).filter((r: Reporte) => r.estado === 'Pendiente' && !r.eliminado)))
            .finally(() => setCargando(false));
    }, []);

    const seleccionar = (r: Reporte) => {
        setSeleccionado(r);
        setTitulo(r.titulo || '');
        setDescripcion(r.descripcion || '');
        setCategoria(r.categoria || '');
        setFotoPreview(r.foto || '');
        setExito(false);
        setError('');
    };

    const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError('La foto no puede superar 5MB.'); return; }
        const reader = new FileReader();
        reader.onload = ev => setFotoPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const guardar = async () => {
        if (!seleccionado || !sesion) return;
        if (!titulo.trim())       { setError('El título es obligatorio.'); return; }
        if (!descripcion.trim())  { setError('La descripción es obligatoria.'); return; }
        if (descripcion.length > 500) { setError('Máximo 500 caracteres en descripción.'); return; }

        setGuardando(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/api/reports/${seleccionado.id}/editar`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sesion.token}` },
                body:    JSON.stringify({ titulo: titulo.trim(), descripcion: descripcion.trim(), categoria, foto: fotoPreview || undefined }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message || 'Error al guardar.'); return; }
            setExito(true);
            setReportes(prev => prev.filter(r => r.id !== seleccionado.id));
            setSeleccionado(null);
        } catch {
            setError('Error de conexión.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <DemoShell huId="HU019" titulo="Editar Reporte" integrante="Julián" color="#7C3AED">

            {exito && <SuccessMessage mensaje="Reporte actualizado correctamente." />}

            {/* Seleccionar reporte */}
            <Card>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: '0 0 10px' }}>
                    Reportes editables (estado Pendiente)
                </h3>
                {cargando ? (
                    <p style={{ fontSize: '13px', color: '#94A3B8' }}>Cargando…</p>
                ) : reportes.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#94A3B8' }}>No tienes reportes en estado Pendiente para editar.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                        {reportes.map(r => (
                            <div key={r.id} onClick={() => seleccionar(r)} style={{
                                padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                                border: `2px solid ${seleccionado?.id === r.id ? '#7C3AED' : '#E2E8F0'}`,
                                backgroundColor: seleccionado?.id === r.id ? '#F5F3FF' : '#F8FAFC',
                            }}>
                                <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: '0 0 2px' }}>{r.titulo}</p>
                                <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>{r.codigo} · {new Date(r.fecha_creacion).toLocaleDateString('es-CL')}</p>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Formulario de edición */}
            {seleccionado && (
                <Card>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#7C3AED', margin: '0 0 14px' }}>
                        Editando: {seleccionado.codigo}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Título */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Título</label>
                            <input value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={100}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', boxSizing: 'border-box' }} />
                        </div>

                        {/* Descripción */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                                Descripción ({descripcion.length}/500)
                            </label>
                            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} maxLength={500} rows={3}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
                        </div>

                        {/* Categoría */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Categoría</label>
                            <select value={categoria} onChange={e => setCategoria(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', backgroundColor: '#fff' }}>
                                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Foto */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Foto (máx. 5MB)</label>
                            {fotoPreview && (
                                <img src={fotoPreview} alt="preview" style={{ width: '100%', borderRadius: '8px', marginBottom: '8px', maxHeight: '140px', objectFit: 'cover' }} />
                            )}
                            <input type="file" accept="image/*" onChange={handleFoto}
                                style={{ fontSize: '12px', color: '#64748B' }} />
                        </div>

                        {/* Aviso ubicación */}
                        <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '10px 12px' }}>
                            <p style={{ fontSize: '12px', color: '#92400E', margin: 0 }}>
                                📍 La ubicación GPS no puede modificarse una vez creado el reporte.
                            </p>
                        </div>

                        {error && <p style={{ fontSize: '13px', color: '#EF4444', margin: 0 }}>{error}</p>}

                        <button onClick={guardar} disabled={guardando} style={{
                            padding: '12px', borderRadius: '10px', border: 'none', cursor: guardando ? 'not-allowed' : 'pointer',
                            backgroundColor: guardando ? '#C4B5FD' : '#7C3AED', color: '#fff', fontWeight: '700', fontSize: '14px',
                        }}>
                            {guardando ? 'Guardando…' : 'Guardar cambios'}
                        </button>
                    </div>
                </Card>
            )}
        </DemoShell>
    );
}
