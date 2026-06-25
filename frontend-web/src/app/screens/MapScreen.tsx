import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { api, API_URL } from '../../services/api';
import { Reporte, EstadoReporte } from '../../shared/types';

const COLOR: Record<EstadoReporte, string> = {
    'Pendiente':  '#EF4444',
    'En Proceso': '#F59E0B',
    'Resuelto':   '#22C55E',
    'Rechazado':  '#6B7280',
};

const ICON = (color: string, big = false) => L.divIcon({
    html: `<div style="width:${big?18:14}px;height:${big?18:14}px;background:${color};border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
    className: '', iconSize: [big?18:14, big?18:14], iconAnchor: [big?9:7, big?9:7],
});

const ICON_GPS = L.divIcon({
    html: `<div style="width:16px;height:16px;background:#3B82F6;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(59,130,246,0.25)"></div>`,
    className: '', iconSize: [16, 16], iconAnchor: [8, 8],
});

interface ReporteEnMapa extends Reporte {
    confirmaciones?: number;
    ya_confirme?:    boolean;
}

export default function MapScreen() {
    const navigate     = useNavigate();
    const mapRef       = useRef<HTMLDivElement>(null);
    const mapInst      = useRef<L.Map | null>(null);
    const gpsMarker    = useRef<L.Marker | null>(null);
    const reportLayers = useRef<Map<string, L.Marker>>(new Map());

    const [reportes,    setReportes]    = useState<ReporteEnMapa[]>([]);
    const [seleccion,   setSeleccion]   = useState<ReporteEnMapa | null>(null);
    const [confirmando, setConfirmando] = useState(false);
    const [msgConfirm,  setMsgConfirm]  = useState('');

    const uid    = localStorage.getItem('cleanmap_uid')    || '';
    const nombre = localStorage.getItem('cleanmap_nombre') || '';

    useLayoutEffect(() => {
        if (!mapRef.current || mapInst.current) return;
        const map = L.map(mapRef.current, {
            center: [-33.4378, -70.6260], zoom: 14,
            zoomControl: false, attributionControl: false,
        });
        mapInst.current = map;
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd', maxZoom: 20,
        }).addTo(map);
        // Necesario cuando el contenedor usa flex: sin esto Leaflet no mide bien el tamaño
        setTimeout(() => map.invalidateSize(), 50);
        return () => { map.remove(); mapInst.current = null; };
    }, []);

    useEffect(() => {
        api.get<{ status: string; data: ReporteEnMapa[] }>('/api/reports/', { params: { usuarioId: uid, usuarioRol: 'Ciudadano' } })
            .then(r => setReportes(r.data.data || []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        const map = mapInst.current;
        if (!map || !reportes.length) return;
        reportLayers.current.forEach(m => m.remove());
        reportLayers.current.clear();
        reportes.forEach(r => {
            const color  = COLOR[r.estado] ?? '#6B7280';
            const marker = L.marker([r.latitud, r.longitud], { icon: ICON(color) }).addTo(map);
            marker.on('click', () => {
                setSeleccion(r);
                setMsgConfirm('');
                map.panTo([r.latitud, r.longitud]);
            });
            reportLayers.current.set(r.id, marker);
        });
    }, [reportes]);

    const irAMiUbicacion = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(pos => {
            const map = mapInst.current;
            if (!map) return;
            const ll = L.latLng(pos.coords.latitude, pos.coords.longitude);
            if (gpsMarker.current) gpsMarker.current.setLatLng(ll);
            else gpsMarker.current = L.marker(ll, { icon: ICON_GPS }).addTo(map);
            map.setView(ll, 16);
        });
    };

    const confirmar = async () => {
        if (!seleccion) return;
        setConfirmando(true);
        try {
            const res = await api.post(`/api/reports/${seleccion.id}/confirmar`);
            if (res.status === 200) {
                setMsgConfirm('✅ ¡Confirmado! Gracias por validar.');
                setSeleccion(s => s ? { ...s, ya_confirme: true } : null);
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || '';
            setMsgConfirm(msg === 'Ya confirmaste este reporte anteriormente.' ? '✓ Ya lo confirmaste antes.' : '❌ Error al confirmar.');
        } finally {
            setConfirmando(false);
        }
    };

    const fmtFecha = (s: string) => new Date(s).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

    // Estilos compartidos
    const fabBtn: React.CSSProperties = {
        width: '44px', height: '44px', borderRadius: '50%',
        backgroundColor: '#fff', border: 'none', cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'auto',
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#e5e0d8' }}>

            {/* Mapa — capa base, sin z-index explícito */}
            <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />

            {/* ── Capa overlay: z-index 1000 para estar por encima de los panes de Leaflet ── */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 1000, pointerEvents: 'none' }}>

                {/* Header con gradiente */}
                <div style={{
                    background: 'linear-gradient(to bottom, rgba(0,92,46,0.92) 0%, transparent 100%)',
                    padding: '14px 16px 28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    pointerEvents: 'auto',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>🗺️</span>
                        <span style={{ fontSize: '17px', fontWeight: '800', color: '#fff', letterSpacing: '-0.3px' }}>CleanMap</span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>
                        {nombre.split(' ')[0]}
                    </span>
                </div>

                {/* Leyenda */}
                <div style={{
                    position: 'absolute', top: '62px', left: '12px',
                    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '10px',
                    padding: '8px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    display: 'flex', flexDirection: 'column', gap: '4px',
                    pointerEvents: 'auto',
                }}>
                    {(Object.entries(COLOR) as [EstadoReporte, string][]).map(([label, color]) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: color, display: 'inline-block', flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', color: '#475569', fontWeight: '500' }}>{label}</span>
                        </div>
                    ))}
                </div>

                {/* Contador */}
                <div style={{
                    position: 'absolute', top: '62px', right: '12px',
                    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '10px',
                    padding: '6px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    fontSize: '12px', fontWeight: '700', color: '#005c2e',
                    pointerEvents: 'auto',
                }}>
                    {reportes.length} reportes
                </div>

                {/* Botones flotantes derechos (GPS + zoom) */}
                <div style={{
                    position: 'absolute',
                    bottom: seleccion ? '310px' : '90px',
                    right: '14px',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                    transition: 'bottom 0.25s ease',
                }}>
                    <button onClick={irAMiUbicacion} style={{ ...fabBtn, fontSize: '20px' }}>📡</button>
                    <button onClick={() => mapInst.current?.zoomIn()}  style={{ ...fabBtn, fontSize: '22px', fontWeight: '700', color: '#475569' }}>+</button>
                    <button onClick={() => mapInst.current?.zoomOut()} style={{ ...fabBtn, fontSize: '22px', fontWeight: '700', color: '#475569' }}>−</button>
                </div>

                {/* FAB crear reporte — solo cuando no hay popup */}
                {!seleccion && (
                    <button
                        onClick={() => navigate('/app/crear')}
                        style={{
                            position: 'absolute', bottom: '20px', left: '50%',
                            transform: 'translateX(-50%)',
                            width: '60px', height: '60px', borderRadius: '50%',
                            backgroundColor: '#005c2e', border: 'none', cursor: 'pointer',
                            boxShadow: '0 4px 16px rgba(0,92,46,0.5)',
                            fontSize: '30px', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            pointerEvents: 'auto',
                        }}
                    >+</button>
                )}

                {/* Popup de reporte seleccionado */}
                {seleccion && (
                    <div style={{
                        position: 'absolute', bottom: '16px', left: '12px', right: '12px',
                        backgroundColor: '#fff', borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                        padding: '16px',
                        pointerEvents: 'auto',
                    }}>
                        <button
                            onClick={() => setSeleccion(null)}
                            style={{ position: 'absolute', top: '12px', right: '12px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >✕</button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLOR[seleccion.estado], display: 'inline-block', flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>{seleccion.estado}</span>
                        </div>

                        <p style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B', margin: '0 0 4px 0', paddingRight: '30px' }}>{seleccion.titulo}</p>
                        <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px 0' }}>{seleccion.direccion}</p>
                        <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 12px 0' }}>{seleccion.codigo} · {fmtFecha(seleccion.fecha_creacion)}</p>

                        {seleccion.foto && (
                            <img
                                src={seleccion.foto.startsWith('http') || seleccion.foto.startsWith('data:') ? seleccion.foto : `${API_URL}${seleccion.foto}`}
                                alt="foto"
                                style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '10px', marginBottom: '12px' }}
                            />
                        )}

                        {msgConfirm ? (
                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#16A34A', textAlign: 'center', margin: '0 0 8px 0' }}>{msgConfirm}</p>
                        ) : seleccion.ya_confirme ? (
                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#16A34A', textAlign: 'center', margin: '0 0 8px 0' }}>✓ Ya confirmaste este reporte</p>
                        ) : seleccion.ciudadano_id === uid ? null : (
                            <button onClick={confirmar} disabled={confirmando} style={{
                                width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                                backgroundColor: confirmando ? '#A7F3D0' : '#059669',
                                color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                                marginBottom: '8px',
                            }}>
                                {confirmando ? 'Registrando…' : '👍 Yo también lo vi'}
                            </button>
                        )}

                        <button onClick={() => navigate('/app/reporte', { state: seleccion.id })} style={{
                            width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #E2E8F0',
                            backgroundColor: '#fff', color: '#005c2e', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                        }}>
                            Ver detalle completo →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
