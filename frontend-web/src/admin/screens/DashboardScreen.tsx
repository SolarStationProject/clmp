import { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface KPI {
    total: number; pendientes: number; en_proceso: number;
    resueltos: number; rechazados: number; pct_resuelto: number;
    por_categoria: Array<{ categoria: string; total: number }>;
    por_comuna:    Array<{ comuna: string;    total: number }>;
}

const BAR_COLORS = ['#0EA5E9', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const KPI_CARDS = (kpi: KPI) => [
    { label: 'Total reportes', valor: kpi.total,      color: '#005c2e', bg: '#F0FDF4', border: '#BBF7D0' },
    { label: 'Pendientes',     valor: kpi.pendientes, color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
    { label: 'En Proceso',     valor: kpi.en_proceso, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    { label: 'Resueltos',      valor: kpi.resueltos,  color: '#16A34A', bg: '#DCFCE7', border: '#BBF7D0' },
    { label: 'Rechazados',     valor: kpi.rechazados, color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' },
];

export default function DashboardScreen() {
    const [kpi,      setKpi]      = useState<KPI | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error,    setError]    = useState('');

    useEffect(() => {
        api.get<{ success: boolean; data: KPI }>('/api/reports/kpis')
            .then(r => { if (r.data.success) setKpi(r.data.data); else setError('Error al cargar KPIs.'); })
            .catch(() => setError('Error de conexión.'))
            .finally(() => setCargando(false));
    }, []);

    if (cargando) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#94A3B8', fontSize: '15px' }}>
            Cargando dashboard…
        </div>
    );
    if (error) return (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '20px', color: '#DC2626' }}>{error}</div>
    );
    if (!kpi) return null;

    const maxCat = Math.max(...kpi.por_categoria.map(c => c.total), 1);
    const maxCom = Math.max(...kpi.por_comuna.map(c => c.total), 1);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
                {KPI_CARDS(kpi).map(k => (
                    <div key={k.label} style={{
                        backgroundColor: k.bg, border: `1px solid ${k.border}`,
                        borderRadius: '14px', padding: '20px 16px', textAlign: 'center',
                    }}>
                        <p style={{ fontSize: '38px', fontWeight: '900', color: k.color, margin: '0 0 6px', lineHeight: 1 }}>{k.valor}</p>
                        <p style={{ fontSize: '13px', color: '#64748B', margin: 0, fontWeight: '500' }}>{k.label}</p>
                    </div>
                ))}
            </div>

            {/* Tasa de resolución */}
            <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: '0 0 14px' }}>Tasa de resolución</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1, height: '16px', backgroundColor: '#E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${kpi.pct_resuelto ?? 0}%`, backgroundColor: '#22C55E', borderRadius: '8px', transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ fontSize: '22px', fontWeight: '900', color: '#22C55E', flexShrink: 0 }}>
                        {kpi.pct_resuelto ?? 0}%
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>{kpi.rechazados} rechazados</span>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>{kpi.resueltos} de {kpi.total} resueltos</span>
                </div>
            </div>

            {/* Categorías y comunas lado a lado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                {/* Por categoría */}
                <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: '0 0 16px' }}>Reportes por categoría</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {kpi.por_categoria.map((c, idx) => (
                            <div key={c.categoria}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '13px', color: '#374151' }}>{c.categoria}</span>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: BAR_COLORS[idx % BAR_COLORS.length] }}>{c.total}</span>
                                </div>
                                <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${(c.total / maxCat) * 100}%`, backgroundColor: BAR_COLORS[idx % BAR_COLORS.length], borderRadius: '4px', transition: 'width 0.5s ease' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Por comuna */}
                <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: '0 0 16px' }}>Top comunas con más reportes</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {kpi.por_comuna.map((c, idx) => (
                            <div key={c.comuna} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#94A3B8', width: '20px', textAlign: 'right', flexShrink: 0 }}>#{idx + 1}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '13px', color: '#374151' }}>{c.comuna}</span>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#005c2e' }}>{c.total}</span>
                                    </div>
                                    <div style={{ height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${(c.total / maxCom) * 100}%`, backgroundColor: '#005c2e', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
