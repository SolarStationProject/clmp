// HU022 — Detección de reportes duplicados a 50 metros
import { useState } from 'react';
import DemoShell, { Card } from './DemoShell';
import { getSession, API_BASE } from './useSession';

// Coords exactas del seed CLM-2026-005 (Av. Salvador, Providencia)
const PRUEBA_CON_DUPLICADO = { lat: -33.4378, lng: -70.6158, label: 'Av. Salvador 1100, Providencia (con duplicado)' };
// Coords en Providencia sin reportes cercanos
const PRUEBA_SIN_DUPLICADO = { lat: -33.4200, lng: -70.6050, label: 'Zona sin reportes en Providencia' };

const COLOR: Record<string, string> = { Pendiente:'#EF4444','En Proceso':'#F59E0B',Resuelto:'#22C55E',Rechazado:'#6B7280' };
const BG:    Record<string, string> = { Pendiente:'#FEE2E2','En Proceso':'#FEF3C7',Resuelto:'#DCFCE7',Rechazado:'#F3F4F6' };

interface Duplicado {
    id: string; codigo: string; titulo: string; categoria: string;
    estado: string; distancia_metros: number;
}

export default function HU022_DeteccionDuplicados() {
    const sesion = getSession();
    const [lat,        setLat]        = useState('');
    const [lng,        setLng]        = useState('');
    const [duplicados, setDuplicados] = useState<Duplicado[] | null>(null);
    const [cargando,   setCargando]   = useState(false);
    const [error,      setError]      = useState('');
    const [modoGPS,    setModoGPS]    = useState(false);

    const verificar = async (latVal: number, lngVal: number) => {
        if (!sesion) return;
        setCargando(true);
        setDuplicados(null);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/api/reports/check-duplicado?lat=${latVal}&lng=${lngVal}`, {
                headers: { Authorization: `Bearer ${sesion.token}` },
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message || 'Error al verificar.'); return; }
            setDuplicados(data.duplicados);
        } catch {
            setError('Error de conexión.');
        } finally {
            setCargando(false);
        }
    };

    const usarGPS = () => {
        if (!navigator.geolocation) { setError('GPS no disponible.'); return; }
        setModoGPS(true);
        navigator.geolocation.getCurrentPosition(
            pos => {
                setLat(String(pos.coords.latitude));
                setLng(String(pos.coords.longitude));
                setModoGPS(false);
                verificar(pos.coords.latitude, pos.coords.longitude);
            },
            () => { setError('No se pudo obtener GPS.'); setModoGPS(false); }
        );
    };

    const usarPrueba = (p: typeof PRUEBA_CON_DUPLICADO) => {
        setLat(String(p.lat));
        setLng(String(p.lng));
        verificar(p.lat, p.lng);
    };

    const hayDuplicados = duplicados !== null && duplicados.length > 0;
    const sinDuplicados = duplicados !== null && duplicados.length === 0;

    return (
        <DemoShell huId="HU022" titulo="Detección de Duplicados" integrante="Jaime" color="#7C3AED">

            {/* Explicación */}
            <div style={{ backgroundColor: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#7C3AED', margin: '0 0 6px' }}>
                    🔍 ¿Qué hace esta HU?
                </p>
                <p style={{ fontSize: '12px', color: '#5B21B6', margin: 0, lineHeight: '1.6' }}>
                    Al crear un reporte, el backend usa <strong>PostGIS ST_DWithin</strong> para detectar si ya existe algún reporte activo a menos de <strong>50 metros</strong>. Si hay duplicados, se alerta al ciudadano y puede decidir si de todas formas envía el reporte.
                </p>
            </div>

            {/* Diagrama del radio */}
            <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px dashed #7C3AED', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#7C3AED' }} />
                        </div>
                        <div style={{ position: 'absolute', bottom: '6px', right: '0', fontSize: '10px', color: '#7C3AED', fontWeight: '700' }}>50m</div>
                    </div>
                    <div>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: '0 0 4px' }}>Radio de detección: 50 metros</p>
                        <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: '1.5' }}>
                            Si hay otro reporte activo dentro del círculo, el sistema lo detecta como posible duplicado. El ciudadano recibe un aviso antes de confirmar.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Verificador */}
            <Card>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: '0 0 12px' }}>
                    Verificar coordenadas
                </h3>

                <button onClick={usarGPS} disabled={modoGPS} style={{
                    width: '100%', padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    backgroundColor: '#7C3AED', color: '#fff', fontWeight: '600', fontSize: '13px', marginBottom: '12px',
                }}>
                    {modoGPS ? 'Obteniendo GPS…' : '📍 Usar mi GPS'}
                </button>

                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 8px', fontWeight: '600' }}>O usar coordenadas de prueba:</p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button onClick={() => usarPrueba(PRUEBA_CON_DUPLICADO)} style={{
                        flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #7C3AED',
                        cursor: 'pointer', backgroundColor: '#F5F3FF', color: '#7C3AED', fontSize: '11px', fontWeight: '600',
                    }}>⚠️ Con duplicado cercano</button>
                    <button onClick={() => usarPrueba(PRUEBA_SIN_DUPLICADO)} style={{
                        flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #22C55E',
                        cursor: 'pointer', backgroundColor: '#F0FDF4', color: '#16A34A', fontSize: '11px', fontWeight: '600',
                    }}>✅ Sin duplicados</button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Latitud</label>
                        <input value={lat} onChange={e => setLat(e.target.value)} placeholder="-33.4378"
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Longitud</label>
                        <input value={lng} onChange={e => setLng(e.target.value)} placeholder="-70.6158"
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                </div>

                <button onClick={() => verificar(parseFloat(lat), parseFloat(lng))} disabled={cargando || !lat || !lng} style={{
                    width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
                    cursor: cargando ? 'not-allowed' : 'pointer',
                    backgroundColor: cargando ? '#94A3B8' : '#7C3AED', color: '#fff', fontWeight: '700', fontSize: '13px',
                }}>
                    {cargando ? 'Buscando duplicados…' : 'Verificar duplicados'}
                </button>

                {error && <p style={{ fontSize: '13px', color: '#EF4444', margin: '10px 0 0' }}>{error}</p>}
            </Card>

            {/* Resultado: duplicados encontrados */}
            {hayDuplicados && (
                <Card>
                    <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#92400E', margin: '0 0 4px' }}>
                            ⚠️ {duplicados!.length} reporte(s) encontrado(s) a menos de 50m
                        </p>
                        <p style={{ fontSize: '12px', color: '#78350F', margin: 0 }}>
                            Ya existe un reporte similar en esta zona. El sistema pedirá confirmación antes de crear uno nuevo.
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {duplicados!.map(d => (
                            <div key={d.id} style={{
                                display: 'flex', gap: '10px', alignItems: 'center',
                                padding: '10px 12px', borderRadius: '10px', backgroundColor: '#FFFBEB',
                                border: '1px solid #FDE68A',
                            }}>
                                <div style={{ fontSize: '20px' }}>📋</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: '0 0 2px',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.titulo}</p>
                                    <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>
                                        {d.codigo} · {d.categoria}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '8px',
                                        backgroundColor: BG[d.estado], color: COLOR[d.estado] }}>{d.estado}</span>
                                    <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: '700' }}>
                                        📏 {d.distancia_metros}m
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Resultado: sin duplicados */}
            {sinDuplicados && (
                <div style={{
                    backgroundColor: '#F0FDF4', border: '2px solid #22C55E',
                    borderRadius: '14px', padding: '20px', textAlign: 'center',
                }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
                    <p style={{ fontSize: '15px', fontWeight: '800', color: '#16A34A', margin: '0 0 6px' }}>
                        Sin reportes duplicados
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                        No hay reportes activos a menos de 50 metros. Puedes enviar el reporte sin inconvenientes.
                    </p>
                </div>
            )}
        </DemoShell>
    );
}
