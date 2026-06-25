import { useState, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { api } from '../../services/api';
import { CATEGORIAS } from '../../demo/mocks/data';

const MAX_DESC    = 500;
const MAX_FOTO_MB = 5;

const ICON_PIN = L.divIcon({
    html: `<div style="width:18px;height:18px;background:#005c2e;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
    className: '', iconSize: [18, 18], iconAnchor: [9, 9],
});

export default function CrearReporteScreen() {
    const navigate = useNavigate();
    const mapRef   = useRef<HTMLDivElement>(null);
    const mapInst  = useRef<L.Map | null>(null);
    const markerR  = useRef<L.Marker | null>(null);

    const [titulo,      setTitulo]      = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [categoria,   setCategoria]   = useState('');
    const [direccion,   setDireccion]   = useState('');
    const [comuna,      setComuna]      = useState('');
    const [foto,        setFoto]        = useState<string | null>(null);
    const [fotoErr,     setFotoErr]     = useState('');
    const [coords,      setCoords]      = useState<{ lat: number; lng: number } | null>(null);
    const [gpsOk,       setGpsOk]       = useState(false);
    const [enviando,    setEnviando]    = useState(false);
    const [error,       setError]       = useState('');
    const [paso,        setPaso]        = useState<1 | 2>(1);
    const [duplicados,  setDuplicados]  = useState<any[] | null>(null);
    const [checkDup,    setCheckDup]    = useState(false);

    const checkDuplicados = (lat: number, lng: number) => {
        setCheckDup(true); setDuplicados(null);
        api.get(`/api/reports/check-duplicado?lat=${lat}&lng=${lng}`)
            .then((r: any) => setDuplicados(r.data.duplicados ?? []))
            .catch(() => setDuplicados([]))
            .finally(() => setCheckDup(false));
    };

    const reverseGeocode = (lat: number, lng: number) => {
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`)
            .then(r => r.json())
            .then(d => {
                const a = d.address || {};
                const calle = a.road || a.pedestrian || '';
                const num   = a.house_number ? ` ${a.house_number}` : '';
                if (calle) setDireccion(`${calle}${num}`);
                else setDireccion('');
                const com = a.suburb || a.city_district || a.quarter || '';
                setComuna(com || '');
            })
            .catch(() => {});
    };

    const crearMarker = (latlng: L.LatLng, map: L.Map) => {
        const m = L.marker(latlng, { icon: ICON_PIN, draggable: true }).addTo(map);
        m.on('dragend', () => {
            const pos = m.getLatLng();
            setCoords({ lat: pos.lat, lng: pos.lng });
            checkDuplicados(pos.lat, pos.lng);
            reverseGeocode(pos.lat, pos.lng);
        });
        return m;
    };

    useLayoutEffect(() => {
        if (paso !== 2) return;
        if (!mapRef.current || mapInst.current) return;
        const map = L.map(mapRef.current, { center: [-33.4378, -70.6260], zoom: 14, zoomControl: false, attributionControl: false });
        mapInst.current = map;
        setTimeout(() => map.invalidateSize(), 50);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 20 }).addTo(map);
        map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            setCoords({ lat, lng });
            if (markerR.current) { markerR.current.setLatLng(e.latlng); }
            else { markerR.current = crearMarker(e.latlng, map); }
            checkDuplicados(lat, lng);
            reverseGeocode(lat, lng);
        });
        return () => { map.remove(); mapInst.current = null; markerR.current = null; };
    }, [paso]);

    const capturarGPS = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(pos => {
            const ll = L.latLng(pos.coords.latitude, pos.coords.longitude);
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            if (markerR.current) { markerR.current.setLatLng(ll); }
            else if (mapInst.current) { markerR.current = crearMarker(ll, mapInst.current); }
            mapInst.current?.setView(ll, 16);
            setGpsOk(true);
            checkDuplicados(pos.coords.latitude, pos.coords.longitude);
            reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        });
    };

    const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFotoErr('');
        const file = e.target.files?.[0];
        if (!file) return;
        const mb = file.size / 1024 / 1024;
        if (mb > MAX_FOTO_MB) { setFotoErr(`La foto supera ${MAX_FOTO_MB}MB.`); return; }
        const reader = new FileReader();
        reader.onload = () => setFoto(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleEnviar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!coords) { setError('Selecciona la ubicación en el mapa o usa GPS.'); return; }
        if (!foto)   { setError('Adjunta una foto de evidencia.'); return; }
        setEnviando(true);
        setError('');
        try {
            await api.post('/api/reports/crear', {
                titulo, descripcion, categoria,
                direccion: direccion || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
                comuna:    comuna    || 'Providencia',
                latitud:   coords.lat,
                longitud:  coords.lng,
                foto,
            });
            navigate('/app/mis-reportes', { replace: true });
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error al crear el reporte.');
        } finally {
            setEnviando(false);
        }
    };

    const inp: React.CSSProperties = {
        width: '100%', padding: '12px 14px', borderRadius: '10px',
        border: '1.5px solid #E2E8F0', fontSize: '14px', outline: 'none',
        boxSizing: 'border-box', color: '#1e293b', backgroundColor: '#fff', fontFamily: 'inherit',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* Header */}
            <div style={{ backgroundColor: '#005c2e', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>‹</button>
                <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0 }}>Nuevo reporte</h1>
                {/* Steps */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                    {[1, 2].map(s => (
                        <div key={s} style={{ width: '28px', height: '4px', borderRadius: '2px', backgroundColor: paso >= s ? '#fff' : 'rgba(255,255,255,0.3)' }} />
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <form onSubmit={handleEnviar}>

                    {paso === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                            {/* Foto */}
                            <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                <p style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', margin: '0 0 10px 0' }}>📸 Foto de evidencia *</p>
                                {foto ? (
                                    <div style={{ position: 'relative' }}>
                                        <img src={foto} alt="preview" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px' }} />
                                        <button type="button" onClick={() => setFoto(null)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', fontSize: '13px' }}>✕</button>
                                    </div>
                                ) : (
                                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120px', borderRadius: '10px', border: '2px dashed #CBD5E1', cursor: 'pointer', backgroundColor: '#F8FAFC', gap: '6px' }}>
                                        <span style={{ fontSize: '28px' }}>📷</span>
                                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Toca para seleccionar foto</span>
                                        <input type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{ display: 'none' }} />
                                    </label>
                                )}
                                {fotoErr && <p style={{ fontSize: '12px', color: '#DC2626', margin: '6px 0 0 0' }}>{fotoErr}</p>}
                            </div>

                            {/* Datos */}
                            <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input style={inp} type="text" placeholder="Título del reporte *" value={titulo} onChange={e => setTitulo(e.target.value)} required />
                                <textarea style={{ ...inp, resize: 'vertical', minHeight: '80px' }}
                                    placeholder={`Describe el problema… (máx. ${MAX_DESC} caracteres)`}
                                    value={descripcion}
                                    onChange={e => { if (e.target.value.length <= MAX_DESC) setDescripcion(e.target.value); }}
                                    required
                                />
                                <select style={inp} value={categoria} onChange={e => setCategoria(e.target.value)} required>
                                    <option value="">Categoría de residuos *</option>
                                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <button type="button" onClick={() => { if (!titulo || !descripcion || !categoria || !foto) { setError('Completa todos los campos y adjunta una foto.'); return; } setError(''); setPaso(2); }}
                                style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: '#005c2e', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                                Siguiente: Ubicación →
                            </button>
                            {error && <p style={{ fontSize: '13px', color: '#DC2626', textAlign: 'center', margin: 0 }}>{error}</p>}
                        </div>
                    )}

                    {paso === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                            {/* Mapa */}
                            <div style={{ backgroundColor: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                <div style={{ padding: '12px 14px 0' }}>
                                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', margin: '0 0 10px 0' }}>📍 Ubicación del basural</p>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                        <button type="button" onClick={capturarGPS} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: gpsOk ? '#DCFCE7' : '#005c2e', color: gpsOk ? '#16A34A' : '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                                            {gpsOk ? '✅ GPS capturado' : '📡 Usar mi ubicación'}
                                        </button>
                                    </div>
                                </div>
                                <div ref={mapRef} style={{ width: '100%', height: '200px' }} />
                                <p style={{ fontSize: '11px', color: '#94A3B8', padding: '8px 14px', margin: 0 }}>
                                    {coords ? `📌 ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Toca el mapa para marcar la ubicación'}
                                </p>
                            </div>

                            {/* Dirección */}
                            <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input style={inp} type="text" placeholder="Dirección (auto-detectada con GPS)" value={direccion} onChange={e => setDireccion(e.target.value)} />
                                <input style={inp} type="text" placeholder="Comuna (ej: Providencia)" value={comuna} onChange={e => setComuna(e.target.value)} />
                            </div>

                            {/* Resultado verificación duplicados */}
                            {checkDup && (
                                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#64748B' }}>
                                    🔍 Verificando si ya existe un reporte cercano…
                                </div>
                            )}
                            {!checkDup && duplicados !== null && duplicados.length > 0 && (
                                <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '14px' }}>
                                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#92400E', margin: '0 0 8px 0' }}>
                                        ⚠️ {duplicados.length} reporte(s) ya registrado(s) a menos de 50m
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                                        {duplicados.map((d: any) => (
                                            <div key={d.id} style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '8px 10px', border: '1px solid #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B', margin: '0 0 1px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.titulo}</p>
                                                    <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>{d.codigo} · {d.categoria}</p>
                                                </div>
                                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#F59E0B', marginLeft: '8px', flexShrink: 0 }}>📏 {d.distancia_metros}m</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: '12px', color: '#78350F', margin: 0 }}>Puedes igual enviar el reporte si consideras que es un problema distinto.</p>
                                </div>
                            )}
                            {!checkDup && duplicados !== null && duplicados.length === 0 && (
                                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#15803D', fontWeight: '600' }}>
                                    ✅ Sin reportes duplicados en esta zona
                                </div>
                            )}

                            {error && (
                                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#DC2626' }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => { setPaso(1); setError(''); }} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', backgroundColor: '#fff', color: '#64748B', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                                    ← Volver
                                </button>
                                <button type="submit" disabled={enviando || !coords} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: enviando || !coords ? '#94A3B8' : '#005c2e', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: enviando || !coords ? 'default' : 'pointer' }}>
                                    {enviando ? '⏳ Enviando…' : '📤 Enviar reporte'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
