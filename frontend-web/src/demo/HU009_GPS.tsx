// HU009 — Geolocalización automática GPS (Jaime)
// Usa navigator.geolocation real del navegador
// Criterios: pedir permiso, obtener coords, marcador en mapa, mover manualmente, alerta > 50m
// Resultado esperado: "Ubicación GPS capturada y confirmada"
import { useRef, useState, useLayoutEffect } from 'react';
import L from 'leaflet';
import DemoShell, { SuccessMessage, Card, btnStyle } from './DemoShell';

type EstadoGPS = 'inicial' | 'solicitando' | 'capturado' | 'error';

const ICON_GPS = L.divIcon({
    html: `<div style="width:22px;height:22px;background:#0EA5E9;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

export default function HU009_GPS() {
    const mapRef      = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markerRef   = useRef<L.Marker | null>(null);
    const circleRef   = useRef<L.Circle | null>(null);

    const [estado,     setEstado]     = useState<EstadoGPS>('inicial');
    const [coords,     setCoords]     = useState<{ lat: number; lng: number; precision: number } | null>(null);
    const [ajustado,   setAjustado]   = useState(false);
    const [confirmado, setConfirmado] = useState(false);
    const [errorMsg,   setErrorMsg]   = useState('');
    const [direccion,  setDireccion]  = useState('');

    useLayoutEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        const map = L.map(mapRef.current, {
            center: [-33.4489, -70.6693],
            zoom: 13,
            zoomControl: true,
            attributionControl: false,
        });
        mapInstance.current = map;

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd', maxZoom: 20,
        }).addTo(map);

        // Click en mapa = ajuste manual del marcador
        map.on('click', (e: L.LeafletMouseEvent) => {
            if (!markerRef.current) return;
            markerRef.current.setLatLng(e.latlng);
            if (circleRef.current) map.removeLayer(circleRef.current);
            setCoords(c => c ? { ...c, lat: e.latlng.lat, lng: e.latlng.lng } : null);
            setAjustado(true);
        });

        return () => {
            map.remove();
            mapInstance.current = null;
        };
    }, []);

    const colocarMarcador = (lat: number, lng: number, precision: number) => {
        const map = mapInstance.current;
        if (!map) return;

        const latlng = L.latLng(lat, lng);

        if (markerRef.current) {
            markerRef.current.setLatLng(latlng);
        } else {
            markerRef.current = L.marker(latlng, { icon: ICON_GPS, draggable: true }).addTo(map);
            markerRef.current.on('dragend', () => {
                const pos = markerRef.current!.getLatLng();
                if (circleRef.current) map.removeLayer(circleRef.current);
                setCoords(c => c ? { ...c, lat: pos.lat, lng: pos.lng } : null);
                setAjustado(true);
            });
        }

        // Círculo de precisión
        if (circleRef.current) map.removeLayer(circleRef.current);
        if (precision < 500) {
            circleRef.current = L.circle(latlng, {
                radius:      precision,
                color:       '#0EA5E9',
                fillColor:   '#0EA5E9',
                fillOpacity: 0.08,
                weight:      1,
            }).addTo(map);
        }

        map.setView(latlng, 16);
    };

    const capturarGPS = () => {
        if (!navigator.geolocation) {
            setEstado('error');
            setErrorMsg('La geolocalización no está disponible en este navegador.');
            return;
        }

        setEstado('solicitando');
        setErrorMsg('');
        setAjustado(false);
        setConfirmado(false);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng, accuracy } = pos.coords;
                setCoords({ lat, lng, precision: Math.round(accuracy) });
                colocarMarcador(lat, lng, accuracy);
                setEstado('capturado');
                // Reverse geocoding automático
                fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`)
                    .then(r => r.json())
                    .then(data => {
                        const addr = data.address || {};
                        const calle  = addr.road || addr.pedestrian || '';
                        const numero = addr.house_number ? ` ${addr.house_number}` : '';
                        const com    = addr.suburb || addr.city_district || addr.quarter || '';
                        if (calle) setDireccion(`${calle}${numero}${com ? ', ' + com : ''}`);
                    })
                    .catch(() => {});
            },
            (err) => {
                setEstado('error');
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setErrorMsg('Permiso de ubicación denegado. Habilítalo en la configuración del navegador.');
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setErrorMsg('Ubicación no disponible. Verifica que el GPS esté activado.');
                        break;
                    case err.TIMEOUT:
                        setErrorMsg('Tiempo de espera agotado. Intenta de nuevo en un área con mejor señal.');
                        break;
                    default:
                        setErrorMsg('Error al obtener la ubicación.');
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const confirmar = () => setConfirmado(true);

    return (
        <DemoShell huId="HU009" titulo="Geolocalización Automática GPS" integrante="Jaime" color="#0EA5E9">

            {/* Mapa */}
            <div style={{ borderRadius: '14px', overflow: 'hidden', height: '320px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '16px', position: 'relative' }}>
                <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

                {estado === 'inicial' && (
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, borderRadius: '14px' }}>
                        <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.5)', padding: '10px 18px', borderRadius: '10px' }}>
                            📍 Presiona "Capturar GPS" para iniciar
                        </p>
                    </div>
                )}

                {(estado === 'capturado' || ajustado) && (
                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', zIndex: 10, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', color: '#475569', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                        {ajustado ? '📌 Arrastra el marcador o haz click para reposicionar' : '💡 Arrastra el marcador para ajustar la ubicación'}
                    </div>
                )}
            </div>

            {/* Controles */}
            <Card>
                {estado === 'solicitando' ? (
                    <div style={{ backgroundColor: '#EFF6FF', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏳</div>
                        <p style={{ fontSize: '14px', color: '#2563EB', fontWeight: '700', margin: '0 0 4px 0' }}>Obteniendo ubicación GPS…</p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>El navegador está solicitando permiso y conectando con satélites</p>
                    </div>
                ) : (
                    <button
                        onClick={capturarGPS}
                        disabled={confirmado}
                        style={btnStyle(confirmado ? '#94a3b8' : '#0EA5E9')}
                    >
                        {estado === 'inicial' ? '📡 Capturar ubicación GPS real' : '🔄 Recapturar ubicación'}
                    </button>
                )}

                {estado === 'error' && (
                    <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '12px', marginTop: '12px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#DC2626', margin: '0 0 6px 0' }}>❌ Error de geolocalización</p>
                        <p style={{ fontSize: '12px', color: '#991B1B', margin: 0 }}>{errorMsg}</p>
                    </div>
                )}
            </Card>

            {/* Coordenadas */}
            {coords && (
                <Card>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: '0 0 14px 0' }}>
                        📡 Coordenadas {ajustado ? '(ajustadas manualmente)' : 'GPS reales'}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                        {[['Latitud', coords.lat.toFixed(7)], ['Longitud', coords.lng.toFixed(7)]].map(([label, val]) => (
                            <div key={label} style={{ backgroundColor: '#F0F9FF', borderRadius: '10px', padding: '12px' }}>
                                <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 4px 0', fontWeight: '600' }}>{label}</p>
                                <p style={{ fontSize: '13px', fontWeight: '800', color: '#0EA5E9', margin: 0, fontFamily: 'monospace' }}>{val}</p>
                            </div>
                        ))}
                    </div>

                    {/* Dirección obtenida automáticamente */}
                    {direccion && (
                        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}>
                            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 2px 0', fontWeight: '600' }}>🏠 Dirección detectada automáticamente</p>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#15803D', margin: 0 }}>{direccion}</p>
                        </div>
                    )}

                    {/* Indicador de precisión */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                        borderRadius: '10px', marginBottom: '14px',
                        backgroundColor: coords.precision > 50 ? '#FEF2F2' : '#F0FDF4',
                        border: `1px solid ${coords.precision > 50 ? '#FCA5A5' : '#86EFAC'}`,
                    }}>
                        <span style={{ fontSize: '20px' }}>{coords.precision > 50 ? '⚠️' : '✅'}</span>
                        <div>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: coords.precision > 50 ? '#DC2626' : '#16A34A', margin: 0 }}>
                                Precisión: ±{coords.precision} metros
                            </p>
                            {coords.precision > 50 && (
                                <p style={{ fontSize: '12px', color: '#B91C1C', margin: '3px 0 0 0' }}>
                                    Precisión baja. Muévete a un área abierta o ajusta el marcador manualmente.
                                </p>
                            )}
                        </div>
                    </div>

                    {!confirmado ? (
                        <button onClick={confirmar} style={btnStyle('#0EA5E9')}>
                            ✓ Confirmar ubicación
                        </button>
                    ) : (
                        <SuccessMessage mensaje="Ubicación GPS capturada y confirmada" />
                    )}
                </Card>
            )}
        </DemoShell>
    );
}
