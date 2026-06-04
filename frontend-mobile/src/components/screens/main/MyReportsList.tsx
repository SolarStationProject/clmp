import { useAxios } from '../../../hooks/useAxios';
import { useNavigate } from 'react-router-dom';
import { Reporte, EstadoReporte } from '../../../shared/types';
import { ICONS } from '../../../assets/icons';
import { formatearFecha } from '../../../utils/formatters';
import TabBar from '../../ui/TabBar';

interface BackendResponse { success: boolean; data: Reporte[]; }

// HU010: Colores canónicos de los 4 estados
const getStatusStyle = (estado: EstadoReporte) => {
    switch (estado) {
        case 'Pendiente':  return { bg: '#FEE2E2', text: '#EF4444', border: '#FECACA' };
        case 'En Proceso': return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
        case 'Resuelto':   return { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' };
        case 'Rechazado':  return { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' };
    }
};

export default function MyReportsList() {
    const navigate = useNavigate();
    const ciudadanoId = localStorage.getItem('cleanmap_uid') || 'c2222222-2222-2222-2222-222222222222';
    const { data: respuesta, loading, error } = useAxios<BackendResponse>('/api/reports/my-reports', { ciudadanoId });
    const reportes = respuesta?.data ?? [];

    if (error) return <p style={{ padding: '16px', color: 'red' }}>Error: {error}</p>;

    const stats = {
        total:     reportes.length,
        pendiente: reportes.filter(r => r.estado === 'Pendiente').length,
        enProceso: reportes.filter(r => r.estado === 'En Proceso').length,
        resuelto:  reportes.filter(r => r.estado === 'Resuelto').length,
        rechazado: reportes.filter(r => r.estado === 'Rechazado').length,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#005c2e', padding: '42px 16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
                <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><ICONS.ArrowLeft /></button>
                <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Mis Reportes</h1>
                <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><ICONS.Bell /></button>
            </div>

            {/* Contadores */}
            <div style={{ backgroundColor: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-around', borderBottom: '1px solid #e2e8f0' }}>
                {[['Total', stats.total, '#1e293b'], ['Pendiente', stats.pendiente, '#EF4444'], ['En Proceso', stats.enProceso, '#D97706'], ['Resuelto', stats.resuelto, '#16A34A'], ['Rechazado', stats.rechazado, '#6B7280']].map(([label, n, color]) => (
                    <div key={label as string} style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '18px', fontWeight: '800', color: color as string, margin: 0 }}>{n as number}</p>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>{label as string}</p>
                    </div>
                ))}
            </div>

            {/* Lista */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Cargando…</div>
                ) : reportes.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#64748b', marginTop: '40px' }}>No tienes reportes creados.</p>
                ) : (
                    reportes.map(r => {
                        const st = getStatusStyle(r.estado);
                        return (
                            <div key={r.id} onClick={() => navigate('/report-detail', { state: [r.id, r.rol ?? 'Ciudadano', r.fecha_creacion] })} style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '14px', border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{r.codigo}</span>
                                    <span style={{ fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '10px', backgroundColor: st.bg, color: st.text, border: `1px solid ${st.border}` }}>{r.estado}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0, maxWidth: '80%' }}>{r.titulo}</h3>
                                    <ICONS.ChevronRight />
                                </div>
                                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ICONS.MapPin /><span style={{ fontSize: '11px', color: '#64748b' }}>{r.direccion}</span></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ICONS.Calendar /><span style={{ fontSize: '11px', color: '#64748b' }}>{formatearFecha(r.fecha_creacion)}</span></div>
                                </div>
                            </div>
                        );
                    })
                )}
                {!loading && <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>Toca un reporte para ver su estado e historial</p>}
            </div>
            <TabBar currentTab="my-reports" />
        </div>
    );
}
