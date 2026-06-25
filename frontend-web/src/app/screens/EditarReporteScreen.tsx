import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, API_URL } from '../../services/api';
import { CATEGORIAS } from '../../demo/mocks/data';

export default function EditarReporteScreen() {
    const navigate  = useNavigate();
    const { state } = useLocation();
    const { id, titulo: tInit = '', descripcion: dInit = '', categoria: cInit = '', foto: fInit = '' } = (state as any) || {};

    const [titulo,      setTitulo]      = useState<string>(tInit);
    const [descripcion, setDescripcion] = useState<string>(dInit);
    const [categoria,   setCategoria]   = useState<string>(cInit);
    const [foto,        setFoto]        = useState<string>(fInit || '');
    const [guardando,   setGuardando]   = useState(false);
    const [error,       setError]       = useState('');

    const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError('La foto no puede superar 5MB.'); return; }
        const reader = new FileReader();
        reader.onload = ev => setFoto(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleGuardar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titulo.trim())      { setError('El título es obligatorio.'); return; }
        if (!descripcion.trim()) { setError('La descripción es obligatoria.'); return; }
        setGuardando(true); setError('');
        try {
            await api.put(`/api/reports/${id}/editar`, {
                titulo:      titulo.trim(),
                descripcion: descripcion.trim(),
                categoria,
                ...(foto ? { foto } : {}),
            });
            navigate(-1);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error al guardar.');
        } finally {
            setGuardando(false);
        }
    };

    const inp: React.CSSProperties = {
        width: '100%', padding: '12px 14px', borderRadius: '10px',
        border: '1.5px solid #E2E8F0', fontSize: '14px', outline: 'none',
        boxSizing: 'border-box', color: '#1e293b', backgroundColor: '#fff',
        fontFamily: 'inherit',
    };

    const fotoSrc = foto
        ? (foto.startsWith('data:') || foto.startsWith('http') ? foto : `${API_URL}${foto}`)
        : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* Header */}
            <div style={{ backgroundColor: '#7C3AED', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>‹</button>
                <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0 }}>Editar reporte</h1>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                        {/* Título */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px' }}>Título *</label>
                            <input style={inp} type="text" value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={100} required />
                        </div>

                        {/* Descripción */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                                Descripción * ({descripcion.length}/500)
                            </label>
                            <textarea
                                style={{ ...inp, resize: 'vertical', minHeight: '90px' }}
                                value={descripcion}
                                onChange={e => { if (e.target.value.length <= 500) setDescripcion(e.target.value); }}
                                required
                            />
                        </div>

                        {/* Categoría */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px' }}>Categoría</label>
                            <select style={inp} value={categoria} onChange={e => setCategoria(e.target.value)}>
                                <option value="">Sin categoría</option>
                                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Foto */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px' }}>Foto (máx. 5MB)</label>
                            {fotoSrc && (
                                <div style={{ position: 'relative', marginBottom: '8px' }}>
                                    <img src={fotoSrc} alt="preview" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px' }} />
                                    <button type="button" onClick={() => setFoto('')} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                                </div>
                            )}
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', border: '1.5px dashed #CBD5E1', cursor: 'pointer', backgroundColor: '#F8FAFC' }}>
                                <span style={{ fontSize: '18px' }}>📷</span>
                                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Cambiar foto</span>
                                <input type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>

                    {/* Aviso GPS */}
                    <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px 14px' }}>
                        <p style={{ fontSize: '12px', color: '#92400E', margin: 0 }}>
                            📍 La ubicación GPS no puede modificarse una vez creado el reporte.
                        </p>
                    </div>

                    {error && (
                        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#DC2626' }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={guardando} style={{
                        padding: '15px', borderRadius: '12px', border: 'none',
                        backgroundColor: guardando ? '#C4B5FD' : '#7C3AED',
                        color: '#fff', fontWeight: '700', fontSize: '15px',
                        cursor: guardando ? 'default' : 'pointer',
                        marginBottom: '8px',
                    }}>
                        {guardando ? '⏳ Guardando…' : '✅ Guardar cambios'}
                    </button>
                </form>
            </div>
        </div>
    );
}
