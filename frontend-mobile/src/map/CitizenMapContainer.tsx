// Versión mobile del mapa — rol = 'Ciudadano', zoom bottom = 115px
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import { Reporte, EstadoReporte } from '../shared/types';
import { ICONS } from '../assets/icons';
import { formatearFecha, formatearHora } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

const COLOR_ESTADO: Record<EstadoReporte, string> = {
    'Pendiente':  '#EF4444',
    'En Proceso': '#F59E0B',
    'Resuelto':   '#22C55E',
    'Rechazado':  '#6B7280',
};
const BG_ESTADO: Record<EstadoReporte, string> = {
    'Pendiente':  '#FEE2E2',
    'En Proceso': '#FEF3C7',
    'Resuelto':   '#DCFCE7',
    'Rechazado':  '#F3F4F6',
};

interface CitizenMapContainerProps {
    onSelectMarker:        (id: string) => void;
    idReporteSeleccionado: string | null;
    reportesData:          Reporte[];
}
interface MarcadorPortal { punto: Reporte; contenedorElemento: HTMLDivElement; }

let puntosMock: Reporte[] = [];

export default function CitizenMapContainer({ onSelectMarker, idReporteSeleccionado, reportesData }: CitizenMapContainerProps) {
    const navigate = useNavigate();
    puntosMock = reportesData;

    const mapRef      = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const [marcadores, setMarcadores] = useState<MarcadorPortal[]>([]);
    const selectRef = useRef(onSelectMarker);
    useEffect(() => { selectRef.current = onSelectMarker; }, [onSelectMarker]);

    useLayoutEffect(() => {
        if (!mapRef.current || mapInstance.current) return;
        const map = L.map(mapRef.current, { center: [-33.4489, -70.6693], zoom: 12, zoomControl: false, attributionControl: false });
        mapInstance.current = map;
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 20 }).addTo(map);

        const items: MarcadorPortal[] = puntosMock.map(punto => {
            const contenedor = document.createElement('div');
            const icon = L.divIcon({ html: contenedor, className: 'marcador-portal-contenedor', iconSize: [0, 0], iconAnchor: [0, 0] });
            const marker = L.marker([punto.latitud, punto.longitud], { icon }).addTo(map);
            marker.on('click', () => { selectRef.current(punto.id); map.panTo([punto.latitud, punto.longitud]); });
            return { punto, contenedorElemento: contenedor };
        });
        setMarcadores(items);
        return () => { map.remove(); mapInstance.current = null; };
    }, []);

    useEffect(() => {
        if (!mapInstance.current || !idReporteSeleccionado) return;
        const p = puntosMock.find(r => r.id === idReporteSeleccionado);
        if (p) mapInstance.current.panTo([p.latitud, p.longitud]);
    }, [idReporteSeleccionado]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflowY: 'auto' }}>
            <div style={{ position: 'absolute', bottom: '115px', right: '16px', backgroundColor: '#fff', borderRadius: '8px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', zIndex: 10, overflow: 'hidden' }}>
                <button onClick={() => mapInstance.current?.zoomIn()}  style={{ width: '40px', height: '40px', border: 'none', backgroundColor: '#fff', fontSize: '22px', cursor: 'pointer' }}>+</button>
                <button onClick={() => mapInstance.current?.zoomOut()} style={{ width: '40px', height: '40px', border: 'none', borderTop: '1px solid #eee', backgroundColor: '#fff', fontSize: '22px', cursor: 'pointer' }}>−</button>
            </div>

            <div ref={mapRef} style={{ width: '100%', height: '80%', zIndex: 0 }} />

            {marcadores.map(({ punto, contenedorElemento }) => {
                const sel   = punto.id === idReporteSeleccionado;
                const color = COLOR_ESTADO[punto.estado] ?? '#6B7280';
                const bg    = BG_ESTADO[punto.estado]    ?? '#F3F4F6';
                return createPortal(
                    <div key={punto.id}>
                        {sel && (
                            <div style={{ position: 'absolute', bottom: '50%', left: '50%', transform: 'translateX(-50%)', marginBottom: '20px', width: '260px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: '1px solid #ddd', overflow: 'hidden', zIndex: 30, padding: '12px' }}>
                                <button onClick={(e) => { e.stopPropagation(); onSelectMarker(''); }} style={{ position: 'absolute', top: '8px', right: '8px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#F3F4F6', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}><ICONS.X /></button>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '8px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                                        {punto.estado === 'Rechazado' ? <ICONS.RefusedMark /> : punto.estado === 'Resuelto' ? <ICONS.CheckMark /> : <ICONS.InfoMark />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#111', margin: '0 0 3px 0' }}>{punto.titulo}</h3>
                                        <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>{formatearFecha(punto.fecha_creacion)}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                    <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', backgroundColor: bg, color }}>{punto.estado}</span>
                                    <button onClick={() => navigate('/report-detail', { state: [punto.id, 'Ciudadano', punto.fecha_creacion] })} style={{ background: 'none', border: 'none', color: '#005c2e', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Ver ❯</button>
                                </div>
                            </div>
                        )}
                        <div style={{ position: 'absolute', width: '26px', height: '26px', backgroundColor: color, borderRadius: '50% 50% 50% 0', transform: 'translateX(-50%) translateY(-100%) rotate(-45deg)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '2px solid #fff' }} />
                    </div>,
                    contenedorElemento
                );
            })}

            {/* Lista de reportes cercanos */}
            <div style={{ padding: '12px 12px 90px 12px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '12px 0 10px 4px' }}>Reportes cercanos ({marcadores.length})</p>
                {marcadores.map(({ punto: item }) => {
                    const color = COLOR_ESTADO[item.estado] ?? '#6B7280';
                    const bg    = BG_ESTADO[item.estado]    ?? '#F3F4F6';
                    return (
                        <div key={item.id} onClick={() => onSelectMarker(item.id)} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F9F9F9', borderRadius: '12px', padding: '10px', border: '1px solid #EAEAEA', gap: '10px', cursor: 'pointer', marginBottom: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                                {item.estado === 'Rechazado' ? <ICONS.RefusedMark /> : item.estado === 'Resuelto' ? <ICONS.CheckMark /> : <ICONS.InfoMark />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#222', margin: '0 0 2px 0' }}>{item.titulo.length > 40 ? item.titulo.slice(0, 40) + '…' : item.titulo}</h4>
                                <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>{formatearFecha(item.fecha_creacion)}</p>
                            </div>
                            <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', backgroundColor: bg, color, whiteSpace: 'nowrap' }}>{item.estado}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
