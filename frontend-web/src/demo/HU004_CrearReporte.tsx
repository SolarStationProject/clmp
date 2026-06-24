// HU004 — Crear reporte con foto y GPS (Jaime)
// Usa navigator.geolocation real del navegador
// Criterios: cámara, foto máx 5MB, descripción máx 500 chars, categoría, GPS automático,
//            ajuste manual, estado inicial Pendiente
// Resultado esperado: "Reporte creado con estado Pendiente"
import { useRef, useState, useLayoutEffect } from 'react';
import L from 'leaflet';
import DemoShell, { SuccessMessage, Card, FormField, inputStyle, btnStyle } from './DemoShell';
import { CATEGORIAS, BG_ESTADO, TEXT_ESTADO } from './mocks/data';
import { getSession, API_BASE } from './useSession';

const MAX_DESC    = 500;
const MAX_FOTO_MB = 5;

const ICON_REPORTE = L.divIcon({
    html: `<div style="width:20px;height:20px;background:#0EA5E9;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

export default function HU004_CrearReporte() {
    const mapRef      = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markerRef   = useRef<L.Marker | null>(null);
    const circleRef   = useRef<L.Circle | null>(null);

    const sesion = getSession();

    const [titulo,           setTitulo]           = useState('');
    const [descripcion,      setDescripcion]      = useState('');
    const [categoria,        setCategoria]        = useState('');
    const [direccion,        setDireccion]        = useState('');
    const [comuna,           setComuna]           = useState('');
    const [foto,             setFoto]             = useState<{ nombre: string; preview: string; tamanoMB: number } | null>(null);
    const [fotoError,        setFotoError]        = useState('');
    const [coords,           setCoords]           = useState<{ lat: number; lng: number; precision: number } | null>(null);
    const [gpsEstado,        setGpsEstado]        = useState<'idle' | 'cargando' | 'ok' | 'error'>('idle');
    const [gpsError,         setGpsError]         = useState('');
    const [ajustado,         setAjustado]         = useState(false);
    const [enviando,         setEnviando]         = useState(false);
    const [errorEnvio,       setErrorEnvio]       = useState('');
    const [creado,           setCreado]           = useState<{ codigo: string } | null>(null);
    const [rawResponse,      setRawResponse]      = useState<unknown>(null);
    const [modoUbicacion,    setModoUbicacion]    = useState<'gps' | 'manual'>('gps');
    const [busqueda,         setBusqueda]         = useState('');
    const [buscando,         setBuscando]         = useState(false);
    const [errorGeocode,     setErrorGeocode]     = useState('');
    const [geocodeOk,        setGeocodeOk]        = useState(false);

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

        // Click en mapa = reposicionamiento manual
        map.on('click', (e: L.LeafletMouseEvent) => {
            if (!markerRef.current) return;
            markerRef.current.setLatLng(e.latlng);
            if (circleRef.current) { map.removeLayer(circleRef.current); circleRef.current = null; }
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
            markerRef.current = L.marker(latlng, { icon: ICON_REPORTE, draggable: true }).addTo(map);
            markerRef.current.on('dragend', () => {
                const pos = markerRef.current!.getLatLng();
                if (circleRef.current) { map.removeLayer(circleRef.current); circleRef.current = null; }
                setCoords(c => c ? { ...c, lat: pos.lat, lng: pos.lng } : null);
                setAjustado(true);
            });
        }

        if (circleRef.current) map.removeLayer(circleRef.current);
        if (precision < 500) {
            circleRef.current = L.circle(latlng, {
                radius: precision,
                color: '#0EA5E9', fillColor: '#0EA5E9', fillOpacity: 0.08, weight: 1,
            }).addTo(map);
        }

        map.setView(latlng, 16);
    };

    const capturarGPS = () => {
        if (!navigator.geolocation) {
            setGpsEstado('error');
            setGpsError('La geolocalización no está disponible en este navegador.');
            return;
        }

        setGpsEstado('cargando');
        setGpsError('');
        setAjustado(false);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng, accuracy } = pos.coords;
                setCoords({ lat, lng, precision: Math.round(accuracy) });
                colocarMarcador(lat, lng, accuracy);
                setGpsEstado('ok');
                // Reverse geocoding automático con Nominatim
                fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`)
                    .then(r => r.json())
                    .then(data => {
                        const addr = data.address || {};
                        const calle  = addr.road || addr.pedestrian || '';
                        const numero = addr.house_number ? ` ${addr.house_number}` : '';
                        if (calle) setDireccion(`${calle}${numero}`);
                        const com = addr.suburb || addr.city_district || addr.quarter || addr.town || '';
                        if (com) setComuna(com);
                    })
                    .catch(() => {});
            },
            (err) => {
                setGpsEstado('error');
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setGpsError('Permiso denegado. Habilita la ubicación en el navegador.');
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setGpsError('Ubicación no disponible. Verifica que el GPS esté activo.');
                        break;
                    case err.TIMEOUT:
                        setGpsError('Tiempo de espera agotado. Inténtalo de nuevo.');
                        break;
                    default:
                        setGpsError('No se pudo obtener la ubicación.');
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const buscarDireccion = async () => {
        if (!busqueda.trim()) return;
        setBuscando(true);
        setErrorGeocode('');
        setGeocodeOk(false);
        try {
            const r = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(busqueda + ', Providencia, Santiago, Chile')}&format=json&limit=1&countrycodes=cl&addressdetails=1`
            );
            const data = await r.json();
            if (!data.length) { setErrorGeocode('No se encontró esa dirección en Providencia.'); return; }
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            setCoords({ lat, lng, precision: 15 });
            colocarMarcador(lat, lng, 15);
            setGpsEstado('ok');
            setGeocodeOk(true);
            // También auto-rellenar dirección limpia
            const addr = data[0].address || {};
            const calle  = addr.road || addr.pedestrian || '';
            const numero = addr.house_number ? ` ${addr.house_number}` : '';
            if (calle && !direccion) setDireccion(`${calle}${numero}`);
            const com = addr.suburb || addr.city_district || addr.quarter || '';
            if (com && !comuna) setComuna(com);
        } catch {
            setErrorGeocode('No se pudo conectar con el servicio de geocodificación.');
        } finally {
            setBuscando(false);
        }
    };

    const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFotoError('');
        const file = e.target.files?.[0];
        if (!file) return;
        const mb = file.size / 1024 / 1024;
        if (mb > MAX_FOTO_MB) { setFotoError(`La foto supera ${MAX_FOTO_MB}MB (${mb.toFixed(1)}MB).`); return; }
        const reader = new FileReader();
        reader.onload = () => setFoto({ nombre: file.name, preview: reader.result as string, tamanoMB: mb });
        reader.readAsDataURL(file);
    };

    const handleEnviar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!coords || !sesion) return;
        setEnviando(true);
        setErrorEnvio('');
        try {
            const res = await fetch(`${API_BASE}/api/reports/crear`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sesion.token}`,
                },
                body: JSON.stringify({
                    titulo,
                    descripcion,
                    categoria,
                    direccion: direccion || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
                    comuna:    comuna    || 'Sin especificar',
                    latitud:   coords.lat,
                    longitud:  coords.lng,
                    foto:      foto?.preview ?? null,
                }),
            });
            const data = await res.json();
            setRawResponse(data);
            if (!res.ok) { setErrorEnvio(data.message || 'Error al crear el reporte.'); return; }
            setCreado({ codigo: data.data?.codigo || 'CLM-NUEVO' });
        } catch {
            setErrorEnvio('No se pudo conectar con el servidor.');
        } finally {
            setEnviando(false);
        }
    };

    const resetear = () => {
        setCreado(null); setTitulo(''); setDescripcion(''); setCategoria('');
        setDireccion(''); setComuna('');
        setFoto(null); setCoords(null); setGpsEstado('idle'); setAjustado(false); setErrorEnvio(''); setRawResponse(null);
        setBusqueda(''); setErrorGeocode(''); setGeocodeOk(false); setModoUbicacion('gps');
    };

    // ── Pantalla de éxito ──────────────────────────────────────────
    if (creado) return (
        <DemoShell huId="HU004" titulo="Crear Reporte con Foto y GPS" integrante="Jaime" color="#0EA5E9">
            <Card>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: '64px', marginBottom: '12px' }}>📍</div>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px 0' }}>¡Reporte enviado!</h2>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px 0' }}>
                        Código: <strong style={{ color: '#0EA5E9' }}>{creado.codigo}</strong>
                    </p>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: BG_ESTADO['Pendiente'], padding: '8px 16px', borderRadius: '10px', marginBottom: '20px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444', display: 'inline-block' }} />
                        <span style={{ fontSize: '14px', fontWeight: '700', color: TEXT_ESTADO['Pendiente'] }}>Estado: Pendiente</span>
                    </div>

                    <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                        {[
                            ['📝 Título',      titulo],
                            ['📂 Categoría',   categoria],
                            ['📍 Latitud',     coords ? coords.lat.toFixed(7) : ''],
                            ['📍 Longitud',    coords ? coords.lng.toFixed(7) : ''],
                            ['📡 Precisión',   coords ? `±${coords.precision}m` : ''],
                        ].map(([label, val]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                                <span style={{ color: '#64748b' }}>{label}</span>
                                <span style={{ fontWeight: '600', color: '#1e293b', fontFamily: label.includes('°') || label.includes('it') ? 'monospace' : undefined }}>{val}</span>
                            </div>
                        ))}
                    </div>

                    {foto && (
                        <img src={foto.preview} alt="evidencia" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }} />
                    )}

                    <SuccessMessage mensaje="Reporte creado con estado Pendiente" />
                    <button onClick={resetear} style={{ ...btnStyle('#0EA5E9'), marginTop: '16px' }}>Crear otro reporte</button>

                    {rawResponse && (
                        <div style={{ marginTop: '16px', textAlign: 'left' }}>
                            <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>🔍 DEBUG — JSON respuesta API</p>
                            <pre style={{ backgroundColor: '#0F172A', color: '#7DD3FC', borderRadius: '10px', padding: '12px', fontSize: '11px', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {JSON.stringify(rawResponse, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </Card>
        </DemoShell>
    );

    // ── Formulario ────────────────────────────────────────────────
    return (
        <DemoShell huId="HU004" titulo="Crear Reporte con Foto y GPS" integrante="Jaime" color="#0EA5E9">
            <form onSubmit={handleEnviar}>

                {/* Foto */}
                <Card>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: '0 0 12px 0' }}>📸 Foto de evidencia</h3>
                    {foto ? (
                        <div style={{ position: 'relative' }}>
                            <img src={foto.preview} alt="preview" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '10px' }} />
                            <button type="button" onClick={() => setFoto(null)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                            <p style={{ fontSize: '11px', color: '#64748b', margin: '6px 0 0 0' }}>{foto.nombre} · {foto.tamanoMB.toFixed(2)} MB</p>
                        </div>
                    ) : (
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '140px', borderRadius: '10px', border: '2px dashed #CBD5E1', cursor: 'pointer', backgroundColor: '#F8FAFC', gap: '8px' }}>
                            <span style={{ fontSize: '32px' }}>📷</span>
                            <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', margin: 0 }}>Seleccionar foto</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>JPG / PNG / WebP · máx {MAX_FOTO_MB} MB</p>
                            <input type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
                        </label>
                    )}
                    {fotoError && <p style={{ fontSize: '12px', color: '#DC2626', margin: '6px 0 0 0' }}>{fotoError}</p>}
                </Card>

                {/* Datos */}
                <Card>
                    <FormField label="Título del reporte">
                        <input style={inputStyle} type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej: Basural en Av. Principal 123" required />
                    </FormField>
                    <FormField label={`Descripción (${descripcion.length}/${MAX_DESC} caracteres)`}>
                        <textarea
                            style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
                            value={descripcion}
                            onChange={e => { if (e.target.value.length <= MAX_DESC) setDescripcion(e.target.value); }}
                            placeholder="Describe el tipo de residuos, tamaño y situación..."
                            required
                        />
                        {descripcion.length > MAX_DESC - 50 && (
                            <p style={{ fontSize: '11px', color: '#D97706', margin: '3px 0 0 0' }}>{MAX_DESC - descripcion.length} caracteres restantes</p>
                        )}
                    </FormField>
                    <FormField label="Categoría de residuos">
                        <select style={inputStyle} value={categoria} onChange={e => setCategoria(e.target.value)} required>
                            <option value="">Seleccionar categoría…</option>
                            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </FormField>
                    <FormField label="Dirección (opcional — se usa coordenadas si se omite)">
                        <input style={inputStyle} type="text" value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Ej: Av. Principal 1234" />
                    </FormField>
                    <FormField label="Comuna (opcional)">
                        <input style={inputStyle} type="text" value={comuna} onChange={e => setComuna(e.target.value)} placeholder="Ej: Providencia" />
                    </FormField>
                </Card>

                {/* Ubicación: toggle GPS / Dirección manual */}
                <Card>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: '0 0 12px 0' }}>📍 Ubicación</h3>

                    {/* Toggle */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                        {(['gps', 'manual'] as const).map(modo => (
                            <button
                                key={modo}
                                type="button"
                                onClick={() => { setModoUbicacion(modo); setCoords(null); setGpsEstado('idle'); setGeocodeOk(false); setErrorGeocode(''); }}
                                style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px',
                                    backgroundColor: modoUbicacion === modo ? '#0EA5E9' : '#F1F5F9',
                                    color: modoUbicacion === modo ? '#fff' : '#64748B' }}
                            >
                                {modo === 'gps' ? '📡 GPS automático' : '✏️ Escribir dirección'}
                            </button>
                        ))}
                    </div>

                    {/* Modo GPS */}
                    {modoUbicacion === 'gps' && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                            <button
                                type="button"
                                onClick={capturarGPS}
                                disabled={gpsEstado === 'cargando'}
                                style={{ padding: '7px 14px', backgroundColor: gpsEstado === 'cargando' ? '#94a3b8' : '#0EA5E9', color: '#fff', border: 'none', borderRadius: '8px', cursor: gpsEstado === 'cargando' ? 'default' : 'pointer', fontSize: '12px', fontWeight: '700' }}
                            >
                                {gpsEstado === 'cargando' ? '⏳ Obteniendo…' : gpsEstado === 'ok' ? '🔄 Recapturar' : '📡 Capturar GPS'}
                            </button>
                        </div>
                    )}

                    {/* Modo dirección manual */}
                    {modoUbicacion === 'manual' && (
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    style={{ ...inputStyle, flex: 1 }}
                                    type="text"
                                    value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), buscarDireccion())}
                                    placeholder="Ej: Av. Providencia 1234"
                                />
                                <button
                                    type="button"
                                    onClick={buscarDireccion}
                                    disabled={buscando || !busqueda.trim()}
                                    style={{ padding: '10px 16px', backgroundColor: buscando ? '#94a3b8' : '#0EA5E9', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: buscando ? 'default' : 'pointer', whiteSpace: 'nowrap' }}
                                >
                                    {buscando ? '⏳' : '🔍 Buscar'}
                                </button>
                            </div>
                            <p style={{ fontSize: '11px', color: '#94A3B8', margin: '4px 0 0 0' }}>
                                Busca la dirección dentro de Providencia — se ubicará en el mapa
                            </p>
                            {errorGeocode && <p style={{ fontSize: '12px', color: '#DC2626', fontWeight: '600', margin: '6px 0 0 0' }}>❌ {errorGeocode}</p>}
                            {geocodeOk && <p style={{ fontSize: '12px', color: '#16A34A', fontWeight: '600', margin: '6px 0 0 0' }}>✅ Dirección encontrada y ubicada en el mapa</p>}
                        </div>
                    )}

                    {/* Mapa (siempre visible) */}
                    <div style={{ borderRadius: '10px', overflow: 'hidden', height: '240px', marginBottom: '10px', position: 'relative' }}>
                        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                        {!coords && (
                            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '10px' }}>
                                <p style={{ color: '#fff', fontSize: '12px', fontWeight: '600', background: 'rgba(0,0,0,0.45)', padding: '8px 14px', borderRadius: '8px' }}>
                                    {modoUbicacion === 'gps' ? 'Captura el GPS para ver tu ubicación' : 'Busca una dirección para ubicarla en el mapa'}
                                </p>
                            </div>
                        )}
                    </div>

                    {gpsEstado === 'error' && (
                        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
                            <p style={{ fontSize: '13px', color: '#DC2626', fontWeight: '600', margin: 0 }}>❌ {gpsError}</p>
                        </div>
                    )}

                    {coords && (
                        <div style={{ backgroundColor: '#F0F9FF', borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }}>
                            <span style={{ color: '#0EA5E9', fontWeight: '700' }}>
                                {modoUbicacion === 'manual' ? '📌 Dirección geocodificada' : ajustado ? '📌 Ajustado manualmente' : '✅ GPS capturado'}
                            </span>
                            <span style={{ color: '#64748b', marginLeft: '8px' }}>
                                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                                {modoUbicacion === 'gps' && ` · ±${coords.precision}m`}
                            </span>
                            {modoUbicacion === 'gps' && coords.precision > 50 && (
                                <p style={{ color: '#D97706', margin: '4px 0 0 0', fontWeight: '600' }}>
                                    ⚠️ Precisión baja ({coords.precision}m). Arrastra el marcador para ajustar.
                                </p>
                            )}
                            {direccion && (
                                <p style={{ color: '#16A34A', margin: '4px 0 0 0', fontWeight: '600' }}>
                                    🏠 {direccion}{comuna ? `, ${comuna}` : ''}
                                </p>
                            )}
                        </div>
                    )}
                </Card>

                <button
                    type="submit"
                    style={btnStyle(coords && !enviando ? '#0EA5E9' : '#94a3b8')}
                    disabled={!coords || enviando}
                >
                    {enviando ? '⏳ Enviando reporte…' : coords ? '📤 Enviar reporte' : modoUbicacion === 'gps' ? 'Captura el GPS primero' : 'Busca una dirección primero'}
                </button>
                {errorEnvio && (
                    <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '12px', marginTop: '10px' }}>
                        <p style={{ fontSize: '13px', color: '#DC2626', margin: '0 0 8px 0' }}>❌ {errorEnvio}</p>
                        {rawResponse && (
                            <>
                                <p style={{ fontSize: '11px', fontWeight: '700', color: '#991B1B', margin: '0 0 4px 0' }}>🔍 DEBUG — JSON respuesta API</p>
                                <pre style={{ backgroundColor: '#0F172A', color: '#FCA5A5', borderRadius: '8px', padding: '10px', fontSize: '11px', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                    {JSON.stringify(rawResponse, null, 2)}
                                </pre>
                            </>
                        )}
                    </div>
                )}
            </form>
        </DemoShell>
    );
}
