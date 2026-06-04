// HU005 — Mapa interactivo con marcadores de colores por estado (API real)
// Resultado esperado: "Mapa con reportes geolocalizados"
import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import DemoShell, { SuccessMessage, Card } from './DemoShell';
import { getSession } from './useSession';

type EstadoReporte = 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Rechazado';
type FiltroEstado  = 'Todos' | EstadoReporte;

const COLOR: Record<EstadoReporte, string> = { 'Pendiente':'#EF4444','En Proceso':'#F59E0B','Resuelto':'#22C55E','Rechazado':'#6B7280' };
const BG:    Record<EstadoReporte, string> = { 'Pendiente':'#FEE2E2','En Proceso':'#FEF3C7','Resuelto':'#DCFCE7','Rechazado':'#F3F4F6' };
const TEXT:  Record<EstadoReporte, string> = { 'Pendiente':'#B91C1C','En Proceso':'#D97706','Resuelto':'#15803D','Rechazado':'#4B5563' };

const fmt  = (s: string) => new Date(s).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtH = (s: string) => { const d = new Date(s); return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`; };

interface Reporte { id: string; codigo: string; titulo: string; estado: EstadoReporte; fecha_creacion: string; descripcion?: string; direccion: string; comuna: string; latitud: number; longitud: number; }
interface Marcador { punto: Reporte; contenedor: HTMLDivElement; }

let puntosActivos: Reporte[] = [];

export default function HU005_MapaInteractivo() {
    const sesion = getSession();
    const mapRef      = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const [reportes,    setReportes]    = useState<Reporte[]>([]);
    const [marcadores,  setMarcadores]  = useState<Marcador[]>([]);
    const [seleccionado,setSeleccionado]= useState<string | null>(null);
    const [filtro,      setFiltro]      = useState<FiltroEstado>('Todos');
    const [cargando,    setCargando]    = useState(true);
    const [mostrado,    setMostrado]    = useState(false);
    const selectRef = useRef((id: string) => setSeleccionado(id));

    // Cargar reportes desde la API
    useEffect(() => {
        if (!sesion) return;
        fetch(`/api/reports/?usuarioId=${sesion.uid}&usuarioRol=${sesion.rol}`, {
            headers: { Authorization: `Bearer ${sesion.token}` },
        })
            .then(r => r.json())
            .then(d => { setReportes(d.data || []); setCargando(false); })
            .catch(() => setCargando(false));
    }, []);

    useLayoutEffect(() => {
        if (!mapRef.current || mapInstance.current) return;
        const map = L.map(mapRef.current, { center: [-33.48, -70.65], zoom: 11, zoomControl: false, attributionControl: false });
        mapInstance.current = map;
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 20 }).addTo(map);
        return () => { map.remove(); mapInstance.current = null; };
    }, []);

    // Colocar marcadores cuando llegan los reportes
    useEffect(() => {
        const map = mapInstance.current;
        if (!map || reportes.length === 0) return;
        puntosActivos = reportes;

        const items: Marcador[] = reportes.map(punto => {
            const contenedor = document.createElement('div');
            L.marker([punto.latitud, punto.longitud], {
                icon: L.divIcon({ html: contenedor, className: '', iconSize: [0, 0], iconAnchor: [0, 0] }),
            }).addTo(map).on('click', () => { selectRef.current(punto.id); map.panTo([punto.latitud, punto.longitud]); });
            return { punto, contenedor };
        });
        setMarcadores(items);
        setTimeout(() => setMostrado(true), 300);
    }, [reportes]);

    useEffect(() => {
        if (!mapInstance.current || !seleccionado) return;
        const p = puntosActivos.find(r => r.id === seleccionado);
        if (p) mapInstance.current.panTo([p.latitud, p.longitud]);
    }, [seleccionado]);

    const filtrados = filtro === 'Todos' ? marcadores : marcadores.filter(m => m.punto.estado === filtro);

    return (
        <DemoShell huId="HU005" titulo="Mapa Interactivo de Reportes" integrante="William" color="#059669">

            {/* Leyenda */}
            <Card style={{ padding: '10px 16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#374151' }}>Estados:</span>
                    {(['Pendiente','En Proceso','Resuelto','Rechazado'] as EstadoReporte[]).map(e => (
                        <span key={e} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLOR[e], display: 'inline-block' }} />
                            {e} ({reportes.filter(r => r.estado === e).length})
                        </span>
                    ))}
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8' }}>{reportes.length} reportes totales</span>
                </div>
            </Card>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                {(['Todos','Pendiente','En Proceso','Resuelto','Rechazado'] as FiltroEstado[]).map(f => (
                    <button key={f} onClick={() => setFiltro(f)} style={{ padding: '5px 12px', borderRadius: '16px', border: 'none', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', backgroundColor: filtro === f ? '#059669' : '#E5E7EB', color: filtro === f ? '#fff' : '#374151', fontWeight: filtro === f ? '700' : '400' }}>{f}</button>
                ))}
            </div>

            {/* Mapa */}
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '380px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '12px' }}>
                <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

                {cargando && (
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <p style={{ color: '#64748b', fontSize: '14px' }}>Cargando reportes…</p>
                    </div>
                )}

                {/* Zoom */}
                <div style={{ position: 'absolute', bottom: '20px', right: '12px', zIndex: 10, display: 'flex', flexDirection: 'column', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                    <button onClick={() => mapInstance.current?.zoomIn()}  style={{ width: '36px', height: '36px', border: 'none', backgroundColor: '#fff', fontSize: '20px', cursor: 'pointer' }}>+</button>
                    <button onClick={() => mapInstance.current?.zoomOut()} style={{ width: '36px', height: '36px', border: 'none', borderTop: '1px solid #eee', backgroundColor: '#fff', fontSize: '20px', cursor: 'pointer' }}>−</button>
                </div>

                {/* Portales */}
                {marcadores.map(({ punto, contenedor }) => {
                    const sel   = punto.id === seleccionado;
                    const color = COLOR[punto.estado];
                    const bg    = BG[punto.estado];
                    const txt   = TEXT[punto.estado];
                    const vis   = filtro === 'Todos' || punto.estado === filtro;
                    return createPortal(
                        <div key={punto.id} style={{ display: vis ? 'block' : 'none' }}>
                            {sel && (
                                <div style={{ position: 'absolute', bottom: '50%', left: '50%', transform: 'translateX(-50%)', marginBottom: '20px', width: '240px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 30, padding: '12px', border: `1px solid ${color}40` }}>
                                    <button onClick={(e) => { e.stopPropagation(); setSeleccionado(null); }} style={{ position: 'absolute', top: '8px', right: '8px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 4px 0' }}>{punto.codigo}</p>
                                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>{punto.titulo}</h4>
                                    <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 4px 0' }}>{punto.direccion} — {punto.comuna}</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 8px 0' }}>{fmt(punto.fecha_creacion)} · {fmtH(punto.fecha_creacion)}</p>
                                    <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', backgroundColor: bg, color: txt }}>{punto.estado}</span>
                                </div>
                            )}
                            <div style={{ position: 'absolute', width: '24px', height: '24px', backgroundColor: color, borderRadius: '50% 50% 50% 0', transform: 'translateX(-50%) translateY(-100%) rotate(-45deg)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '2px solid #fff' }} />
                        </div>,
                        contenedor
                    );
                })}
            </div>

            {/* Lista */}
            <Card>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>
                    {filtrados.length} reportes {filtro !== 'Todos' ? `en "${filtro}"` : 'totales'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                    {filtrados.map(({ punto }) => (
                        <div key={punto.id} onClick={() => { setSeleccionado(punto.id); mapInstance.current?.panTo([punto.latitud, punto.longitud]); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', backgroundColor: seleccionado === punto.id ? BG[punto.estado] : '#F8FAFC', border: `1px solid ${seleccionado === punto.id ? COLOR[punto.estado] + '40' : '#E5E7EB'}` }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLOR[punto.estado], flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', margin: '0 0 1px 0' }}>{punto.titulo.length > 45 ? punto.titulo.slice(0, 45) + '…' : punto.titulo}</p>
                                <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{punto.comuna}</p>
                            </div>
                            <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', backgroundColor: BG[punto.estado], color: TEXT[punto.estado], whiteSpace: 'nowrap' }}>{punto.estado}</span>
                        </div>
                    ))}
                </div>
            </Card>

            {mostrado && <SuccessMessage mensaje="Mapa con reportes geolocalizados" />}
        </DemoShell>
    );
}
