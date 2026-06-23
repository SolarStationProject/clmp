// HU012 — Límite de reportes a la comuna de Providencia
import { useState } from 'react';
import DemoShell, { Card } from './DemoShell';
import { getSession, API_BASE } from './useSession';

// Coords de prueba dentro de Providencia (Av. Providencia con Lyon)
const PRUEBA_DENTRO  = { lat: -33.4327, lng: -70.6134, label: 'Av. Providencia 1234 (dentro)' };
// Coords de prueba fuera de Providencia (La Florida)
const PRUEBA_FUERA   = { lat: -33.5180, lng: -70.5785, label: 'La Florida (fuera)' };

interface ResultadoComuna {
    dentro: boolean;
    mensaje: string;
}

export default function HU012_LimiteComuna() {
    const sesion = getSession();
    const [lat,       setLat]       = useState('');
    const [lng,       setLng]       = useState('');
    const [resultado, setResultado] = useState<ResultadoComuna | null>(null);
    const [cargando,  setCargando]  = useState(false);
    const [error,     setError]     = useState('');
    const [modoGPS,   setModoGPS]   = useState(false);

    const verificar = async (latVal: number, lngVal: number) => {
        if (!sesion) return;
        setCargando(true);
        setResultado(null);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/api/reports/check-comuna?lat=${latVal}&lng=${lngVal}`, {
                headers: { Authorization: `Bearer ${sesion.token}` },
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message || 'Error al verificar.'); return; }
            setResultado(data);
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

    const usarPrueba = (p: typeof PRUEBA_DENTRO) => {
        setLat(String(p.lat));
        setLng(String(p.lng));
        verificar(p.lat, p.lng);
    };

    return (
        <DemoShell huId="HU012" titulo="Límite por Comuna" integrante="Jaime" color="#0F766E">

            {/* Explicación */}
            <div style={{ backgroundColor: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#0F766E', margin: '0 0 6px' }}>
                    📍 ¿Qué hace esta HU?
                </p>
                <p style={{ fontSize: '12px', color: '#115E59', margin: 0, lineHeight: '1.6' }}>
                    CleanMap restringe la creación de reportes a la comuna de <strong>Providencia</strong>. Al enviar un reporte, el backend valida que las coordenadas GPS caigan dentro del polígono de Providencia usando PostGIS. Si el ciudadano está fuera, la solicitud es rechazada.
                </p>
            </div>

            {/* Mapa visual aproximado */}
            <Card>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: '0 0 10px' }}>
                    Límite aproximado de Providencia
                </h3>
                <div style={{
                    height: '140px', borderRadius: '10px', overflow: 'hidden', position: 'relative',
                    background: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)',
                    border: '2px solid #0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: '8px',
                }}>
                    <div style={{ fontSize: '36px' }}>🗺️</div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#0F766E', margin: 0 }}>Comuna de Providencia</p>
                        <p style={{ fontSize: '11px', color: '#115E59', margin: '2px 0 0' }}>
                            Lat: -33.407 a -33.452 · Lng: -70.589 a -70.638
                        </p>
                    </div>
                </div>
                <p style={{ fontSize: '11px', color: '#94A3B8', margin: '8px 0 0' }}>
                    Validación backend usa bounding box PostGIS. En producción se reemplaza por el polígono oficial del MINVU.
                </p>
            </Card>

            {/* Verificador de coordenadas */}
            <Card>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: '0 0 12px' }}>
                    Verificar ubicación
                </h3>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button onClick={usarGPS} disabled={modoGPS} style={{
                        flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        backgroundColor: '#0F766E', color: '#fff', fontWeight: '600', fontSize: '13px',
                    }}>
                        {modoGPS ? 'Obteniendo GPS…' : '📍 Usar mi GPS'}
                    </button>
                </div>

                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 8px', fontWeight: '600' }}>O probar con coordenadas de ejemplo:</p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button onClick={() => usarPrueba(PRUEBA_DENTRO)} style={{
                        flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #0F766E',
                        cursor: 'pointer', backgroundColor: '#F0FDFA', color: '#0F766E', fontSize: '12px', fontWeight: '600',
                    }}>✅ Dentro de Providencia</button>
                    <button onClick={() => usarPrueba(PRUEBA_FUERA)} style={{
                        flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #EF4444',
                        cursor: 'pointer', backgroundColor: '#FEF2F2', color: '#EF4444', fontSize: '12px', fontWeight: '600',
                    }}>❌ Fuera de Providencia</button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Latitud</label>
                        <input value={lat} onChange={e => setLat(e.target.value)} placeholder="-33.4327"
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Longitud</label>
                        <input value={lng} onChange={e => setLng(e.target.value)} placeholder="-70.6134"
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                </div>

                <button onClick={() => verificar(parseFloat(lat), parseFloat(lng))} disabled={cargando || !lat || !lng} style={{
                    width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
                    cursor: cargando ? 'not-allowed' : 'pointer',
                    backgroundColor: cargando ? '#94A3B8' : '#0F766E', color: '#fff', fontWeight: '700', fontSize: '13px',
                }}>
                    {cargando ? 'Verificando…' : 'Verificar coordenadas'}
                </button>

                {error && <p style={{ fontSize: '13px', color: '#EF4444', margin: '10px 0 0' }}>{error}</p>}
            </Card>

            {/* Resultado */}
            {resultado && (
                <div style={{
                    backgroundColor: resultado.dentro ? '#F0FDF4' : '#FEF2F2',
                    border: `2px solid ${resultado.dentro ? '#22C55E' : '#EF4444'}`,
                    borderRadius: '14px', padding: '20px', textAlign: 'center',
                }}>
                    <div style={{ fontSize: '44px', marginBottom: '10px' }}>
                        {resultado.dentro ? '✅' : '🚫'}
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: '800', color: resultado.dentro ? '#16A34A' : '#DC2626', margin: '0 0 6px' }}>
                        {resultado.dentro ? 'Dentro de Providencia' : 'Fuera de Providencia'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                        {resultado.dentro
                            ? 'Puedes crear reportes desde esta ubicación.'
                            : 'El sistema rechazará cualquier reporte desde esta ubicación.'}
                    </p>
                    <p style={{ fontSize: '11px', color: '#94A3B8', margin: '8px 0 0', fontFamily: 'monospace' }}>
                        {lat}, {lng}
                    </p>
                </div>
            )}
        </DemoShell>
    );
}
