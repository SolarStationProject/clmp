// HU018 — Indicadores ambientales por zona (Martín)
// Usa leaflet.heat como paquete npm — sin CDN, sin condición de carrera
// Resultado esperado: "Mapa de calor con indicadores ambientales"
import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import L from 'leaflet';
import '../lib/leaflet-heat';
import DemoShell, { SuccessMessage, Card } from './DemoShell';
import { MOCK_REPORTES, EstadoReporte } from './mocks/data';

interface ZonaCritica {
    nombre: string; lat: number; lng: number;
    total: number; pendientes: number; criticidad: 'alta' | 'media' | 'baja';
}

const COLOR_CRIT: Record<string, string> = { alta: '#EF4444', media: '#F97316', baja: '#EAB308' };
const BG_CRIT:   Record<string, string>  = { alta: '#FEF2F2', media: '#FFF7ED', baja: '#FEFCE8' };
const TXT_CRIT:  Record<string, string>  = { alta: '#991B1B', media: '#9A3412', baja: '#854D0E' };

const ZONAS_CRITICAS: ZonaCritica[] = [
    { nombre: 'Zona Sur Santiago', lat: -33.528, lng: -70.595, total: 8, pendientes: 5, criticidad: 'alta'  },
    { nombre: 'Zona Poniente',     lat: -33.510, lng: -70.785, total: 5, pendientes: 3, criticidad: 'media' },
    { nombre: 'Zona Norte',        lat: -33.362, lng: -70.723, total: 3, pendientes: 1, criticidad: 'baja'  },
    { nombre: 'Zona Centro-Sur',   lat: -33.498, lng: -70.648, total: 4, pendientes: 2, criticidad: 'media' },
];

const buildHeatPoints = (filtro: string): [number, number, number][] =>
    MOCK_REPORTES
        .filter(r => !filtro || r.estado === filtro)
        .map(r => [r.latitud, r.longitud, 0.6 + Math.random() * 0.4]);

export default function HU018_MapaCalor() {
    const mapDivRef   = useRef<HTMLDivElement>(null);
    const mapRef      = useRef<L.Map | null>(null);
    const heatRef     = useRef<L.Layer | null>(null);
    const critMarkRef = useRef<L.CircleMarker[]>([]);

    const [filtroEstado, setFiltroEstado] = useState('');
    const [exportando,   setExportando]   = useState(false);

    // Crea el mapa una sola vez
    useLayoutEffect(() => {
        if (!mapDivRef.current || mapRef.current) return;

        const mapa = L.map(mapDivRef.current, {
            center: [-33.47, -70.65],
            zoom: 10,
            attributionControl: false,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 18,
        }).addTo(mapa);

        // Capa de calor inicial (todos los reportes)
        heatRef.current = (L as any).heatLayer(buildHeatPoints(''), {
            radius:    30,
            blur:      25,
            maxZoom:   17,
            gradient:  { 0.2: '#3B82F6', 0.4: '#22C55E', 0.6: '#EAB308', 0.8: '#F97316', 1.0: '#EF4444' },
        }).addTo(mapa);

        // Marcadores de zonas críticas
        ZONAS_CRITICAS.forEach(z => {
            const radio = z.criticidad === 'alta' ? 18 : z.criticidad === 'media' ? 13 : 9;
            const m = L.circleMarker([z.lat, z.lng], {
                radius:      radio,
                fillColor:   COLOR_CRIT[z.criticidad],
                color:       '#fff',
                weight:      2,
                fillOpacity: 0.85,
            }).addTo(mapa);
            m.bindPopup(
                `<b style="color:${COLOR_CRIT[z.criticidad]}">${z.criticidad.toUpperCase()}</b><br/>` +
                `<b>${z.nombre}</b><br/>Total: ${z.total} · Pendientes: ${z.pendientes}`
            );
            critMarkRef.current.push(m);
        });

        mapRef.current = mapa;

        return () => {
            mapa.remove();
            mapRef.current  = null;
            heatRef.current = null;
            critMarkRef.current = [];
        };
    }, []);

    // Actualiza solo la capa de calor cuando cambia el filtro
    useEffect(() => {
        if (!mapRef.current || !heatRef.current) return;
        (heatRef.current as any).setLatLngs(buildHeatPoints(filtroEstado));
    }, [filtroEstado]);

    const exportarCSV = () => {
        setExportando(true);
        const filas = MOCK_REPORTES
            .filter(r => !filtroEstado || r.estado === filtroEstado)
            .map(r => `"${r.id}","${r.latitud}","${r.longitud}","${r.estado}","${r.comuna}","${r.fecha_creacion}"`);
        const csv  = ['id,latitud,longitud,estado,comuna,fecha_creacion', ...filas].join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `cleanmap_calor_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setTimeout(() => setExportando(false), 800);
    };

    const totalMostrados = MOCK_REPORTES.filter(r => !filtroEstado || r.estado === filtroEstado).length;

    return (
        <DemoShell huId="HU018" titulo="Indicadores Ambientales por Zona" integrante="Martín" color="#6D28D9">

            {/* Filtros */}
            <Card style={{ padding: '12px 16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <select
                        value={filtroEstado}
                        onChange={e => setFiltroEstado(e.target.value)}
                        style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', flex: 1 }}
                    >
                        <option value="">Todos los estados</option>
                        {(['Pendiente', 'En Proceso', 'Resuelto', 'Rechazado'] as EstadoReporte[]).map(e => (
                            <option key={e} value={e}>{e}</option>
                        ))}
                    </select>
                    <button
                        onClick={exportarCSV}
                        disabled={exportando}
                        style={{ padding: '7px 16px', backgroundColor: '#6D28D9', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                    >
                        {exportando ? 'Exportando…' : '⬇️ Exportar CSV'}
                    </button>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0 0 0' }}>
                    {totalMostrados} reportes en el mapa de calor
                </p>
            </Card>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                {/* Mapa */}
                <div style={{ flex: 1 }}>
                    <div
                        ref={mapDivRef}
                        style={{ height: '420px', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    />
                    {/* Leyenda de gradiente */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '6px 10px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Baja</span>
                        <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'linear-gradient(to right, #3B82F6, #22C55E, #EAB308, #F97316, #EF4444)' }} />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Alta</span>
                    </div>
                </div>

                {/* Panel lateral */}
                <div style={{ width: '190px', flexShrink: 0 }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', margin: '0 0 10px 0' }}>⚠️ Zonas críticas</h3>
                    {ZONAS_CRITICAS.map((z, i) => (
                        <div
                            key={i}
                            onClick={() => mapRef.current?.setView([z.lat, z.lng], 13)}
                            style={{ padding: '8px', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer', backgroundColor: BG_CRIT[z.criticidad], border: `1px solid ${COLOR_CRIT[z.criticidad]}40` }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: TXT_CRIT[z.criticidad] }}>{z.criticidad.toUpperCase()}</span>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>{z.total}</span>
                            </div>
                            <p style={{ fontSize: '11px', color: TXT_CRIT[z.criticidad], margin: 0, fontWeight: '600' }}>{z.nombre}</p>
                            <p style={{ fontSize: '10px', color: '#94a3b8', margin: '2px 0 0 0' }}>{z.pendientes} pendientes</p>
                        </div>
                    ))}

                    <div style={{ padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>📊 Resumen</p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0' }}>Total: {MOCK_REPORTES.length}</p>
                        <p style={{ fontSize: '12px', color: '#EF4444', margin: '2px 0' }}>Pendientes: {MOCK_REPORTES.filter(r => r.estado === 'Pendiente').length}</p>
                        <p style={{ fontSize: '12px', color: '#F97316', margin: '2px 0' }}>En Proceso: {MOCK_REPORTES.filter(r => r.estado === 'En Proceso').length}</p>
                        <p style={{ fontSize: '12px', color: '#22C55E', margin: '2px 0' }}>Resueltos: {MOCK_REPORTES.filter(r => r.estado === 'Resuelto').length}</p>
                    </div>
                </div>
            </div>

            <SuccessMessage mensaje="Mapa de calor con indicadores ambientales" />
        </DemoShell>
    );
}
