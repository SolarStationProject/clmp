// HU017 — Dashboard de indicadores KPI (solo Administrador)
import { useState, useEffect } from 'react';
import DemoShell, { Card } from './DemoShell';
import { getSession, API_BASE } from './useSession';

interface KPI {
    total: number; pendientes: number; en_proceso: number; resueltos: number; rechazados: number;
    pct_resuelto: number;
    por_categoria: Array<{ categoria: string; total: number }>;
    por_comuna:    Array<{ comuna: string;    total: number }>;
}

const BAR_COLORS = ['#0EA5E9','#22C55E','#F59E0B','#EF4444','#8B5CF6','#EC4899'];

export default function HU017_Dashboard() {
    const sesion = getSession();
    const [kpi,     setKpi]     = useState<KPI | null>(null);
    const [cargando,setCargando] = useState(true);
    const [error,   setError]   = useState('');

    useEffect(() => {
        if (!sesion) return;
        fetch(`${API_BASE}/api/reports/kpis`, {
            headers: { Authorization: `Bearer ${sesion.token}` },
        })
            .then(r => r.json())
            .then(d => { if (d.success) setKpi(d.data); else setError(d.message); })
            .catch(() => setError('Error de conexión.'))
            .finally(() => setCargando(false));
    }, []);

    const maxCat = kpi ? Math.max(...kpi.por_categoria.map(c => c.total), 1) : 1;
    const maxCom = kpi ? Math.max(...kpi.por_comuna.map(c => c.total), 1) : 1;

    return (
        <DemoShell huId="HU017" titulo="Dashboard de Indicadores" integrante="Martín" color="#6D28D9">

            {cargando && <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>Cargando KPIs…</p>}
            {error    && <p style={{ textAlign: 'center', color: '#EF4444', fontSize: '14px' }}>{error}</p>}

            {kpi && (<>
                {/* Tarjetas estado */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                        { label: 'Total reportes',  valor: kpi.total,      color: '#6D28D9', bg: '#F5F3FF' },
                        { label: 'Resueltos',        valor: kpi.resueltos,  color: '#22C55E', bg: '#F0FDF4' },
                        { label: 'En Proceso',       valor: kpi.en_proceso, color: '#F59E0B', bg: '#FFFBEB' },
                        { label: 'Pendientes',       valor: kpi.pendientes, color: '#EF4444', bg: '#FEF2F2' },
                    ].map(k => (
                        <div key={k.label} style={{ backgroundColor: k.bg, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                            <p style={{ fontSize: '32px', fontWeight: '900', color: k.color, margin: '0 0 4px' }}>{k.valor}</p>
                            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>{k.label}</p>
                        </div>
                    ))}
                </div>

                {/* Tasa de resolución */}
                <Card>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: '0 0 10px' }}>
                        Tasa de resolución
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, height: '14px', backgroundColor: '#E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${kpi.pct_resuelto ?? 0}%`, backgroundColor: '#22C55E', borderRadius: '8px', transition: 'width 0.6s ease' }} />
                        </div>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: '#22C55E', flexShrink: 0 }}>
                            {kpi.pct_resuelto ?? 0}%
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>{kpi.rechazados} rechazados</span>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>{kpi.resueltos} de {kpi.total} resueltos</span>
                    </div>
                </Card>

                {/* Por categoría */}
                <Card>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: '0 0 12px' }}>
                        Reportes por categoría
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {kpi.por_categoria.map((c, idx) => (
                            <div key={c.categoria}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                    <span style={{ fontSize: '12px', color: '#374151' }}>{c.categoria}</span>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: BAR_COLORS[idx % BAR_COLORS.length] }}>{c.total}</span>
                                </div>
                                <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${(c.total / maxCat) * 100}%`, backgroundColor: BAR_COLORS[idx % BAR_COLORS.length], borderRadius: '4px' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Por comuna */}
                <Card>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: '0 0 12px' }}>
                        Top 5 comunas con más reportes
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {kpi.por_comuna.map((c, idx) => (
                            <div key={c.comuna} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', width: '16px', textAlign: 'right' }}>#{idx + 1}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                        <span style={{ fontSize: '12px', color: '#374151' }}>{c.comuna}</span>
                                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#6D28D9' }}>{c.total}</span>
                                    </div>
                                    <div style={{ height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${(c.total / maxCom) * 100}%`, backgroundColor: '#6D28D9', borderRadius: '3px' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </>)}
        </DemoShell>
    );
}
