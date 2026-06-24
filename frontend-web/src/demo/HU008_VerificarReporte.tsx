// HU008 — Verificar autenticidad de reportes (solo Administrador)
import { useState, useEffect } from 'react';
import DemoShell, { SuccessMessage, Card } from './DemoShell';
import { getSession, API_BASE } from './useSession';

const PRIORIDAD_COLOR: Record<string, string> = { Baja:'#94A3B8', Normal:'#0EA5E9', Alta:'#F59E0B', 'Crítica':'#EF4444' };
const ESTADO_COLOR:   Record<string, string> = { Pendiente:'#EF4444','En Proceso':'#F59E0B',Resuelto:'#22C55E',Rechazado:'#6B7280' };
const ESTADO_BG:      Record<string, string> = { Pendiente:'#FEE2E2','En Proceso':'#FEF3C7',Resuelto:'#DCFCE7',Rechazado:'#F3F4F6' };

interface Reporte {
    id: string; codigo: string; titulo: string; categoria: string; estado: string;
    prioridad: string; foto?: string; verificado_admin: boolean;
    fecha_creacion: string; nombre: string; confirmaciones: number;
}

const NIVEL_CREDIBILIDAD = (confirmaciones: number, verificado: boolean) => {
    if (verificado && confirmaciones >= 3) return { label: '🟢 Alta',   color: '#22C55E' };
    if (verificado || confirmaciones >= 3) return { label: '🟠 Media',  color: '#F59E0B' };
    if (confirmaciones >= 1)               return { label: '🟡 Baja',   color: '#EAB308' };
    return                                        { label: '⚪ Sin validar', color: '#94A3B8' };
};

const fmt = (s: string) => new Date(s).toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' });

export default function HU008_VerificarReporte() {
    const sesion = getSession();
    const [reportes,   setReportes]   = useState<Reporte[]>([]);
    const [cargando,   setCargando]   = useState(true);
    const [verificando,setVerificando]= useState<string | null>(null);
    const [exito,      setExito]      = useState('');
    const [filtro,     setFiltro]     = useState<'todos'|'pendientes'>('pendientes');
    const [errorApi,   setErrorApi]   = useState('');

    const cargar = () => {
        if (!sesion) return;
        setErrorApi('');
        fetch(`${API_BASE}/api/reports/para-verificar`, {
            headers: { Authorization: `Bearer ${sesion.token}` },
        })
            .then(async r => {
                const d = await r.json();
                if (!r.ok) { setErrorApi(d.message || `Error ${r.status}`); return; }
                setReportes(d.data || []);
            })
            .catch(e => setErrorApi(String(e)))
            .finally(() => setCargando(false));
    };

    useEffect(() => { cargar(); }, []);

    const verificar = async (r: Reporte) => {
        if (!sesion) return;
        setVerificando(r.id);
        setExito('');
        try {
            const res = await fetch(`${API_BASE}/api/reports/${r.id}/verificar`, {
                method:  'PUT',
                headers: { Authorization: `Bearer ${sesion.token}` },
            });
            if (res.ok) {
                setExito(`✅ Reporte "${r.titulo}" verificado como auténtico.`);
                setReportes(prev => prev.map(x => x.id === r.id ? { ...x, verificado_admin: true } : x));
            }
        } finally {
            setVerificando(null);
        }
    };

    const mostrar = filtro === 'pendientes'
        ? reportes.filter(r => !r.verificado_admin)
        : reportes;

    const sinVerificar = reportes.filter(r => !r.verificado_admin).length;

    return (
        <DemoShell huId="HU008" titulo="Verificar Autenticidad" integrante="Alex" color="#7C2D12">

            {exito && <SuccessMessage mensaje={exito} />}

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ backgroundColor: '#FEF2F2', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                    <p style={{ fontSize: '28px', fontWeight: '900', color: '#DC2626', margin: '0 0 4px' }}>{sinVerificar}</p>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Sin verificar</p>
                </div>
                <div style={{ backgroundColor: '#F0FDF4', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                    <p style={{ fontSize: '28px', fontWeight: '900', color: '#22C55E', margin: '0 0 4px' }}>{reportes.length - sinVerificar}</p>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Verificados</p>
                </div>
            </div>

            {/* Explicación */}
            <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', padding: '12px 14px' }}>
                <p style={{ fontSize: '12px', color: '#92400E', margin: 0, lineHeight: '1.6' }}>
                    🤖 <strong>Imagga AI</strong> ya verificó que la foto muestra basura al momento de crear el reporte. El admin puede dar un sello adicional de autenticidad municipal confirmando que el reporte es legítimo.
                </p>
            </div>

            {/* Error de API */}
            {errorApi && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '12px 14px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#DC2626', margin: '0 0 4px' }}>❌ Error al cargar reportes</p>
                    <p style={{ fontSize: '12px', color: '#991B1B', margin: 0, fontFamily: 'monospace' }}>{errorApi}</p>
                </div>
            )}

            {/* Filtro */}
            <Card>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    {(['pendientes', 'todos'] as const).map(f => (
                        <button key={f} onClick={() => setFiltro(f)} style={{
                            padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                            backgroundColor: filtro === f ? '#7C2D12' : '#F1F5F9',
                            color: filtro === f ? '#fff' : '#64748B',
                        }}>
                            {f === 'pendientes' ? `Sin verificar (${sinVerificar})` : `Todos (${reportes.length})`}
                        </button>
                    ))}
                </div>

                {cargando ? (
                    <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center' }}>Cargando…</p>
                ) : mostrar.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center' }}>No hay reportes pendientes de verificación. ✅</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '480px', overflowY: 'auto' }}>
                        {mostrar.map(r => {
                            const cred = NIVEL_CREDIBILIDAD(r.confirmaciones, r.verificado_admin);
                            return (
                                <div key={r.id} style={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', backgroundColor: '#F8FAFC' }}>
                                    {/* Foto */}
                                    {r.foto && (
                                        <img src={r.foto} alt="foto reporte" style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                                    )}
                                    <div style={{ padding: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: 0 }}>{r.titulo}</p>
                                            <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '8px', flexShrink: 0, marginLeft: '8px',
                                                backgroundColor: ESTADO_BG[r.estado], color: ESTADO_COLOR[r.estado] }}>{r.estado}</span>
                                        </div>
                                        <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 8px' }}>
                                            {r.codigo} · {r.nombre} · {fmt(r.fecha_creacion)}
                                        </p>
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '11px', fontWeight: '700', color: cred.color }}>
                                                {cred.label}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>·</span>
                                            <span style={{ fontSize: '11px', color: '#64748B' }}>👥 {r.confirmaciones} confirmaciones</span>
                                            <span style={{ fontSize: '11px', color: '#64748B' }}>·</span>
                                            <span style={{ fontSize: '11px', fontWeight: '700', color: PRIORIDAD_COLOR[r.prioridad] }}>{r.prioridad}</span>
                                        </div>
                                        {r.verificado_admin ? (
                                            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '8px 12px', textAlign: 'center' }}>
                                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#16A34A' }}>✅ Verificado por municipio</span>
                                            </div>
                                        ) : (
                                            <button onClick={() => verificar(r)} disabled={verificando === r.id} style={{
                                                width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
                                                cursor: verificando === r.id ? 'not-allowed' : 'pointer',
                                                backgroundColor: verificando === r.id ? '#FED7AA' : '#7C2D12',
                                                color: '#fff', fontWeight: '700', fontSize: '13px',
                                            }}>
                                                {verificando === r.id ? 'Verificando…' : '✅ Verificar como auténtico'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </DemoShell>
    );
}
