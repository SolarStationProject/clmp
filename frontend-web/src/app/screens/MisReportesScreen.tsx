import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, API_URL } from '../../services/api';
import { Reporte, EstadoReporte } from '../../shared/types';

const COLOR: Record<EstadoReporte, { text: string; bg: string }> = {
    'Pendiente':  { text: '#EF4444', bg: '#FEE2E2' },
    'En Proceso': { text: '#D97706', bg: '#FEF3C7' },
    'Resuelto':   { text: '#16A34A', bg: '#DCFCE7' },
    'Rechazado':  { text: '#6B7280', bg: '#F3F4F6' },
};

const fmtFecha = (s: string) => new Date(s).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

export default function MisReportesScreen() {
    const navigate = useNavigate();
    const uid = localStorage.getItem('cleanmap_uid') || '';

    const [reportes,  setReportes]  = useState<Reporte[]>([]);
    const [cargando,  setCargando]  = useState(true);
    const [error,     setError]     = useState('');
    const [filtro,    setFiltro]    = useState<EstadoReporte | 'Todos'>('Todos');

    useEffect(() => {
        api.get<{ success: boolean; data: Reporte[] }>('/api/reports/propios', { params: { ciudadanoId: uid } })
            .then(r => setReportes(r.data.data || []))
            .catch(() => setError('No se pudieron cargar tus reportes.'))
            .finally(() => setCargando(false));
    }, []);

    const mostrar = filtro === 'Todos' ? reportes : reportes.filter(r => r.estado === filtro);
    const estados: (EstadoReporte | 'Todos')[] = ['Todos', 'Pendiente', 'En Proceso', 'Resuelto', 'Rechazado'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* Header */}
            <div style={{ backgroundColor: '#005c2e', padding: '16px 16px 14px', flexShrink: 0 }}>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>Mis Reportes</h1>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '2px 0 0 0' }}>
                    {reportes.length} reporte{reportes.length !== 1 ? 's' : ''} enviado{reportes.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Filtros */}
            <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #E2E8F0', padding: '10px 12px', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
                {estados.map(e => (
                    <button key={e} onClick={() => setFiltro(e)} style={{
                        padding: '6px 14px', borderRadius: '20px', border: 'none',
                        fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
                        backgroundColor: filtro === e ? '#005c2e' : '#F1F5F9',
                        color: filtro === e ? '#fff' : '#64748B',
                    }}>{e}</button>
                ))}
            </div>

            {/* Lista */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {cargando ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>Cargando…</div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#EF4444', fontSize: '14px' }}>{error}</div>
                ) : mostrar.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                        <p style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>
                            {filtro === 'Todos' ? 'Aún no has enviado reportes' : `No tienes reportes ${filtro.toLowerCase()}`}
                        </p>
                    </div>
                ) : mostrar.map(r => {
                    const c = COLOR[r.estado] ?? COLOR['Pendiente'];
                    return (
                        <div
                            key={r.id}
                            onClick={() => navigate('/app/reporte', { state: r.id })}
                            style={{ backgroundColor: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'pointer', border: '1px solid #F1F5F9' }}
                        >
                            {r.foto && (
                                <img
                                    src={r.foto.startsWith('http') ? r.foto : `${API_URL}${r.foto}`}
                                    alt="foto"
                                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                                />
                            )}
                            <div style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: 0, flex: 1, marginRight: '8px' }}>{r.titulo}</p>
                                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '8px', flexShrink: 0, backgroundColor: c.bg, color: c.text }}>{r.estado}</span>
                                </div>
                                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 6px 0' }}>{r.direccion}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{r.codigo} · {fmtFecha(r.fecha_creacion)}</span>
                                    <span style={{ fontSize: '12px', color: '#005c2e', fontWeight: '600' }}>Ver →</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* FAB crear */}
            <button
                onClick={() => navigate('/app/crear')}
                style={{
                    position: 'absolute', bottom: '74px', right: '16px', zIndex: 20,
                    width: '52px', height: '52px', borderRadius: '50%',
                    backgroundColor: '#005c2e', border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,92,46,0.4)',
                    fontSize: '26px', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >+</button>
        </div>
    );
}
