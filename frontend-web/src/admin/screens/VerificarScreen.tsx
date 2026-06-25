import { useState, useEffect } from 'react';
import { api } from '../../services/api';

const PRIORIDAD_COLOR: Record<string, string> = { Baja:'#94A3B8', Normal:'#0EA5E9', Alta:'#F59E0B', 'Crítica':'#EF4444' };
const ESTADO_COLOR: Record<string, string>    = { Pendiente:'#EF4444','En Proceso':'#F59E0B',Resuelto:'#22C55E',Rechazado:'#6B7280' };
const ESTADO_BG: Record<string, string>       = { Pendiente:'#FEE2E2','En Proceso':'#FEF3C7',Resuelto:'#DCFCE7',Rechazado:'#F3F4F6' };

interface Reporte {
    id: string; codigo: string; titulo: string; categoria: string; estado: string;
    prioridad: string; foto?: string; verificado_admin: boolean;
    fecha_creacion: string; nombre: string; confirmaciones: number;
}

const nivelCredibilidad = (confirmaciones: number, verificado: boolean) => {
    if (verificado && confirmaciones >= 3) return { label: '🟢 Alta',        color: '#22C55E' };
    if (verificado || confirmaciones >= 3) return { label: '🟠 Media',       color: '#F59E0B' };
    if (confirmaciones >= 1)               return { label: '🟡 Baja',        color: '#EAB308' };
    return                                        { label: '⚪ Sin validar', color: '#94A3B8' };
};

const fmt = (s: string) =>
    new Date(s).toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' });

export default function VerificarScreen() {
    const [reportes,    setReportes]    = useState<Reporte[]>([]);
    const [cargando,    setCargando]    = useState(true);
    const [verificando, setVerificando] = useState<string | null>(null);
    const [exito,       setExito]       = useState('');
    const [filtro,      setFiltro]      = useState<'pendientes'|'todos'>('pendientes');
    const [errorApi,    setErrorApi]    = useState('');

    const cargar = () => {
        setErrorApi('');
        api.get<{ data: Reporte[] }>('/api/reports/para-verificar')
            .then(r => setReportes(r.data.data || []))
            .catch(e => setErrorApi(e.message || 'Error al cargar reportes.'))
            .finally(() => setCargando(false));
    };

    useEffect(() => { cargar(); }, []);

    const verificar = async (r: Reporte) => {
        setVerificando(r.id);
        setExito('');
        try {
            await api.put(`/api/reports/${r.id}/verificar`);
            setExito(`Reporte "${r.titulo}" verificado como auténtico.`);
            setReportes(prev => prev.map(x => x.id === r.id ? { ...x, verificado_admin: true } : x));
        } catch { /* silencioso */ }
        finally { setVerificando(null); }
    };

    const sinVerificar = reportes.filter(r => !r.verificado_admin).length;
    const mostrar = filtro === 'pendientes' ? reportes.filter(r => !r.verificado_admin) : reportes;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {exito && (
                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '14px 16px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#16A34A', margin: 0 }}>✅ {exito}</p>
                </div>
            )}

            {/* Explicación */}
            <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontSize: '13px', color: '#92400E', margin: 0, lineHeight: 1.6 }}>
                    🤖 <strong>Imagga AI</strong> ya verificó que la foto muestra basura al momento de crear el reporte.
                    Como administrador puedes dar un sello adicional de autenticidad municipal, elevando la credibilidad del reporte.
                </p>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', maxWidth: '380px' }}>
                <div style={{ backgroundColor: '#FEF2F2', borderRadius: '14px', padding: '20px 16px', textAlign: 'center' }}>
                    <p style={{ fontSize: '38px', fontWeight: '900', color: '#DC2626', margin: '0 0 6px', lineHeight: 1 }}>{sinVerificar}</p>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Sin verificar</p>
                </div>
                <div style={{ backgroundColor: '#F0FDF4', borderRadius: '14px', padding: '20px 16px', textAlign: 'center' }}>
                    <p style={{ fontSize: '38px', fontWeight: '900', color: '#22C55E', margin: '0 0 6px', lineHeight: 1 }}>{reportes.length - sinVerificar}</p>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Verificados</p>
                </div>
            </div>

            {errorApi && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', padding: '14px' }}>
                    <p style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>❌ {errorApi}</p>
                </div>
            )}

            {/* Lista */}
            <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
                    {(['pendientes', 'todos'] as const).map(f => (
                        <button key={f} onClick={() => setFiltro(f)} style={{
                            padding: '7px 18px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                            fontSize: '13px', fontWeight: '600',
                            backgroundColor: filtro === f ? '#7C2D12' : '#F1F5F9',
                            color: filtro === f ? '#fff' : '#64748B',
                        }}>
                            {f === 'pendientes' ? `Sin verificar (${sinVerificar})` : `Todos (${reportes.length})`}
                        </button>
                    ))}
                </div>

                {cargando ? (
                    <p style={{ fontSize: '14px', color: '#94A3B8', textAlign: 'center', padding: '40px 0' }}>Cargando reportes…</p>
                ) : mostrar.length === 0 ? (
                    <p style={{ fontSize: '14px', color: '#94A3B8', textAlign: 'center', padding: '40px 0' }}>
                        {filtro === 'pendientes' ? '✅ No hay reportes pendientes de verificación.' : 'No hay reportes.'}
                    </p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {mostrar.map(r => {
                            const cred = nivelCredibilidad(r.confirmaciones, r.verificado_admin);
                            return (
                                <div key={r.id} style={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', backgroundColor: '#F8FAFC' }}>
                                    {r.foto && (
                                        <img src={r.foto} alt="foto reporte" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                                    )}
                                    <div style={{ padding: '14px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                            <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: 0, flex: 1, marginRight: '8px' }}>
                                                {r.titulo}
                                            </p>
                                            <span style={{
                                                fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '8px', flexShrink: 0,
                                                backgroundColor: ESTADO_BG[r.estado], color: ESTADO_COLOR[r.estado],
                                            }}>{r.estado}</span>
                                        </div>
                                        <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 10px' }}>
                                            {r.codigo} · {r.nombre} · {fmt(r.fecha_creacion)}
                                        </p>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '700', color: cred.color }}>{cred.label}</span>
                                            <span style={{ fontSize: '12px', color: '#94A3B8' }}>·</span>
                                            <span style={{ fontSize: '12px', color: '#64748B' }}>👥 {r.confirmaciones} confirmaciones</span>
                                            <span style={{ fontSize: '12px', color: '#94A3B8' }}>·</span>
                                            <span style={{ fontSize: '12px', fontWeight: '700', color: PRIORIDAD_COLOR[r.prioridad] }}>{r.prioridad}</span>
                                        </div>
                                        {r.verificado_admin ? (
                                            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#16A34A' }}>✅ Verificado por municipio</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => verificar(r)}
                                                disabled={verificando === r.id}
                                                style={{
                                                    width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
                                                    cursor: verificando === r.id ? 'not-allowed' : 'pointer',
                                                    backgroundColor: verificando === r.id ? '#FED7AA' : '#7C2D12',
                                                    color: '#fff', fontWeight: '700', fontSize: '13px',
                                                }}
                                            >
                                                {verificando === r.id ? 'Verificando…' : '✅ Verificar como auténtico'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
