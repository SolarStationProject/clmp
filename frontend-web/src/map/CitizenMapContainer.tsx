import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import { Reporte, EstadoReporte } from '../shared/types';
import { ICONS } from '../assets/icons';
import { formatearFecha, formatearHora } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

// HU005: Colores canónicos por estado
// Pendiente=Rojo, En Proceso=Amarillo, Resuelto=Verde, Rechazado=Gris
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

const colorEstado = (estado: EstadoReporte) => COLOR_ESTADO[estado] ?? '#6B7280';
const bgEstado    = (estado: EstadoReporte) => BG_ESTADO[estado]    ?? '#F3F4F6';

interface CitizenMapContainerProps {
    onSelectMarker:       (idReporte: string) => void;
    idReporteSeleccionado: string | null;
    reportesData:         Reporte[];
}

interface MarcadorPortal {
    punto:              Reporte;
    contenedorElemento: HTMLDivElement;
}

let puntosMock: Reporte[] = [];

export default function CitizenMapContainer({ onSelectMarker, idReporteSeleccionado, reportesData }: CitizenMapContainerProps) {
    const navigate = useNavigate();
    puntosMock = reportesData;

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef  = useRef<L.Map | null>(null);
    const [listaMarcadores, setListaMarcadores] = useState<MarcadorPortal[]>([]);
    const onSelectMarkerRef = useRef(onSelectMarker);

    useEffect(() => { onSelectMarkerRef.current = onSelectMarker; }, [onSelectMarker]);

    useLayoutEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [-33.4489, -70.6693],
            zoom: 12,
            zoomControl: false,
            attributionControl: false,
        });
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 20,
        }).addTo(map);

        const marcadoresIniciales: MarcadorPortal[] = puntosMock.map((punto) => {
            const contenedor = document.createElement('div');
            const icon = L.divIcon({
                html: contenedor,
                className: 'marcador-portal-contenedor',
                iconSize: [0, 0],
                iconAnchor: [0, 0],
            });
            const marker = L.marker([punto.latitud, punto.longitud], { icon }).addTo(map);
            marker.on('click', () => {
                onSelectMarkerRef.current(punto.id);
                map.panTo([punto.latitud, punto.longitud]);
            });
            return { punto, contenedorElemento: contenedor };
        });

        setListaMarcadores(marcadoresIniciales);
        return () => { map.remove(); mapInstanceRef.current = null; };
    }, []);

    useEffect(() => {
        if (!mapInstanceRef.current || !idReporteSeleccionado) return;
        const p = puntosMock.find(r => r.id === idReporteSeleccionado);
        if (p) mapInstanceRef.current.panTo([p.latitud, p.longitud]);
    }, [idReporteSeleccionado]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflowY: 'auto' }}>
            {/* Controles de zoom */}
            <div style={styles.zoomControlWrapper}>
                <button onClick={() => mapInstanceRef.current?.zoomIn()}  style={styles.zoomButton}>+</button>
                <button onClick={() => mapInstanceRef.current?.zoomOut()} style={{ ...styles.zoomButton, borderTop: '1px solid #EAEAEA' }}>−</button>
            </div>

            <div ref={mapContainerRef} style={{ width: '100%', height: '80%', zIndex: 0 }} />

            {/* Portales: marcadores y popup flotante */}
            {listaMarcadores.map(({ punto, contenedorElemento }) => {
                const seleccionado = punto.id === idReporteSeleccionado;
                const color = colorEstado(punto.estado);
                const bg    = bgEstado(punto.estado);

                return createPortal(
                    <div key={punto.id}>
                        {seleccionado && (
                            <div style={styles.detailPopupCard}>
                                <div style={styles.popupHeaderRow}>
                                    <button style={styles.closePopupBtn} onClick={(e) => { e.stopPropagation(); onSelectMarker(''); }}>
                                        <ICONS.X />
                                    </button>
                                    <div style={{ ...styles.photoCountTag, background: `linear-gradient(135deg, ${bg}, white)` }}>
                                        <div style={{ color }}><ICONS.MapPin /></div>
                                    </div>
                                </div>
                                <div style={styles.popupBody}>
                                    <div style={{ ...styles.iconBadge, backgroundColor: color }}>
                                        {punto.estado === 'Rechazado' ? <ICONS.RefusedMark /> :
                                         punto.estado === 'Resuelto'  ? <ICONS.CheckMark />  :
                                         punto.estado === 'En Proceso'? <ICONS.Gear />        :
                                                                         <ICONS.InfoMark />}
                                    </div>
                                    <div style={styles.popupTextContent}>
                                        <h3 style={styles.popupTitle}>{punto.titulo}</h3>
                                        <p style={styles.popupMeta}><ICONS.CalendarMark /> {formatearFecha(punto.fecha_creacion)}</p>
                                        <p style={styles.popupMeta}><ICONS.ClockMark /> {formatearHora(punto.fecha_creacion)}</p>
                                    </div>
                                </div>
                                <div style={styles.popupFooterRow}>
                                    <span style={{ ...styles.statusTag, backgroundColor: bg, color }}>{punto.estado}</span>
                                    <button style={styles.viewMoreBtn} onClick={() => navigate('/report-detail', { state: [punto.id, 'Administrador', punto.fecha_creacion] })}>
                                        Ver detalles ❯
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* Pin del marcador */}
                        <div style={{ position: 'absolute', width: '28px', height: '28px', backgroundColor: color, borderRadius: '50% 50% 50% 0', transform: 'translateX(-50%) translateY(-100%) rotate(-45deg)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '2px solid #fff' }} />
                    </div>,
                    contenedorElemento
                );
            })}

            {/* Lista lateral de reportes */}
            <div style={styles.listContainer}>
                <p style={styles.listTitle}>Reportes ({listaMarcadores.length})</p>
                <div style={styles.scrollableItemsContainer}>
                    {listaMarcadores.map(({ punto: item }) => {
                        const color = colorEstado(item.estado);
                        const bg    = bgEstado(item.estado);
                        return (
                            <div key={item.id} style={styles.listItemCard} onClick={() => onSelectMarker(item.id)}>
                                <div style={{ ...styles.iconBadge, backgroundColor: color }}>
                                    {item.estado === 'Rechazado' ? <ICONS.RefusedMark /> :
                                     item.estado === 'Resuelto'  ? <ICONS.CheckMark />  :
                                                                    <ICONS.InfoMark />}
                                </div>
                                <div style={styles.itemMainInfo}>
                                    <h4 style={styles.itemTitle}>{item.titulo.length > 45 ? item.titulo.slice(0, 45) + '…' : item.titulo}</h4>
                                    <p style={styles.itemMeta}>{formatearFecha(item.fecha_creacion)}</p>
                                </div>
                                <span style={{ ...styles.statusTag, backgroundColor: bg, color }}>{item.estado}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    zoomControlWrapper: { position: 'absolute', bottom: '200px', right: '20px', backgroundColor: '#fff', borderRadius: '8px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', zIndex: 10, overflow: 'hidden' },
    zoomButton: { width: '40px', height: '40px', backgroundColor: '#fff', border: 'none', fontSize: '22px', color: '#333', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', outline: 'none' },
    detailPopupCard: { position: 'absolute', bottom: '50%', left: '50%', transform: 'translateX(-50%)', marginBottom: '30px', width: '275px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', border: '1px solid #ddd', overflow: 'hidden', zIndex: 30, padding: '15px' },
    popupHeaderRow: { marginTop: '-15px', marginLeft: '-15px', marginRight: '-15px', paddingBottom: '15px' },
    photoCountTag: { height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    closePopupBtn: { position: 'absolute', top: '8px', right: '8px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#F3F4F6', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 },
    popupBody: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
    popupTextContent: { flex: 1 },
    popupTitle: { fontSize: '14px', fontWeight: 'bold', color: '#111', margin: '0 0 4px 0' },
    popupMeta: { fontSize: '12px', color: '#888', margin: '2px 0 0 0' },
    popupFooterRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '12px' },
    viewMoreBtn: { background: 'none', border: 'none', color: '#0F7643', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    iconBadge: { width: '36px', height: '36px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px', color: '#fff', flexShrink: 0 },
    statusTag: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' },
    listContainer: { padding: '15px 15px 30px 15px' },
    listTitle: { fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '15px 0 12px 4px' },
    scrollableItemsContainer: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto' },
    listItemCard: { display: 'flex', alignItems: 'center', backgroundColor: '#F9F9F9', borderRadius: '12px', padding: '12px', border: '1px solid #EAEAEA', gap: '12px', cursor: 'pointer' },
    itemMainInfo: { flex: 1 },
    itemTitle: { fontSize: '14px', fontWeight: '600', color: '#222', margin: '0 0 2px 0' },
    itemMeta: { fontSize: '11px', color: '#999', margin: 0 },
};
