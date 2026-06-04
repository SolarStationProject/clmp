// HU018 — Indicadores ambientales por zona (Martín) — API real
// Resultado esperado: "Mapa de calor con indicadores ambientales"
import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import L from 'leaflet';
import '../lib/leaflet-heat';
import DemoShell, { SuccessMessage, Card } from './DemoShell';
import { getSession, API_BASE } from './useSession';

type EstadoReporte = 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Rechazado';

interface HeatPoint    { lat: number; lng: number; intensity: number; }
interface ZonaCritica  { nombre: string; lat: number; lng: number; total: number; pendientes: number; criticidad: 'alta' | 'media' | 'baja'; }
interface HeatMapData  { puntos_calor: HeatPoint[]; zonas_criticas: ZonaCritica[]; total_puntos: number; }

const COLOR_CRIT: Record<string, string> = { alta: '#EF4444', media: '#F97316', baja: '#EAB308' };
const BG_CRIT:   Record<string, string>  = { alta: '#FEF2F2', media: '#FFF7ED', baja: '#FEFCE8' };
const TXT_CRIT:  Record<string, string>  = { alta: '#991B1B', media: '#9A3412', baja: '#854D0E' };

export default function HU018_MapaCalor() {
    const sesion = getSession();

    const mapDivRef   = useRef<HTMLDivElement>(null);
    const mapRef      = useRef<L.Map | null>(null);
    const heatRef     = useRef<L.Layer | null>(null);
    const critMarkRef = useRef<L.CircleMarker[]>([]);

    const [filtroEstado, setFiltroEstado] = useState('');
    const [datos,        setDatos]        = useState<HeatMapData | null>(null);
    const [cargando,     setCargando]     = useState(true);
    const [exportando,   setExportando]   = useState(false);

    // Carga datos del backend
    const cargarDatos = async (filtro: string) => {
        if (!sesion) return;
        setCargando(true);
        try {
            const params = new URLSearchParams();
            if (filtro) params.append('estado', filtro);
            const res  = await fetch(`${API_BASE}/api/heatmap?${params}`, {
                headers: { Authorization: `Bearer ${sesion.token}` },
            });
            const data: HeatMapData = await res.json();
            setDatos(data);

            // Actualizar capa de calor
            if (mapRef.current && heatRef.current) {
                const puntos = data.puntos_calor.map(p => [p.lat, p.lng, p.intensity] as [number, number, number]);
                (heatRef.current as any).setLatLngs(puntos);
            }

            // Actualizar marcadores de zonas críticas
            critMarkRef.current.forEach(m => mapRef.current?.removeLayer(m));
            critMarkRef.current = [];
            if (mapRef.current) {
                data.zonas_criticas.forEach(z => {
                    const radio = z.criticidad === 'alta' ? 18 : z.criticidad === 'media' ? 13 : 9;
                    const m = L.circleMarker([z.lat, z.lng], {
                        radius: radio, fillColor: COLOR_CRIT[z.criticidad],
                        color: '#fff', weight: 2, fillOpacity: 0.85,
                    }).addTo(mapRef.current!);
                    m.bindPopup(
                        `<b style="color:${COLOR_CRIT[z.criticidad]}">${z.criticidad.toUpperCase()}</b><br/>` +
                        `<b>${z.nombre}</b><br/>Total: ${z.total} · Pendientes: ${z.pendientes}`
                    );
                    critMarkRef.current.push(m);
                });
            }
        } catch { /* silencioso */ }
        finally { setCargando(false); }
    };

    // Crea el mapa una sola vez
    useLayoutEffect(() => {
        if (!mapDivRef.current || mapRef.current) return;

        const mapa = L.map(mapDivRef.current, {
            center: [-33.47, -70.65],
            zoom: 10,
            attributionControl: false,
        });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd', maxZoom: 18,
        }).addTo(mapa);

        // Capa de calor vacía al inicio
        heatRef.current = (L as any).heatLayer([], {
            radius:   30,
            blur:     25,
            maxZoom:  17,
            gradient: { 0.2: '#3B82F6', 0.4: '#22C55E', 0.6: '#EAB308', 0.8: '#F97316', 1.0: '#EF4444' },
        }).addTo(mapa);

        mapRef.current = mapa;

        // Cargar datos reales
        cargarDatos('');

        return () => {
            mapa.remove();
            mapRef.current  = null;
            heatRef.current = null;
            critMarkRef.current = [];
        };
    }, []);

    // Recarga al cambiar filtro
    useEffect(() => {
        if (mapRef.current) cargarDatos(filtroEstado);
    }, [filtroEstado]);

    const exportarCSV = async () => {
        if (!sesion) return;
        setExportando(true);
        try {
            const params = new URLSearchParams();
            if (filtroEstado) params.append('estado', filtroEstado);
            const res = await fetch(`${API_BASE}/api/heatmap/exportar?${params}`, {
                headers: { Authorization: `Bearer ${sesion.token}` },
            });
            if (!res.ok) { alert('No hay datos para exportar.'); return; }
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href = url;
            a.download = `cleanmap_calor_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch { alert('Error al exportar.'); }
        finally { setExportando(false); }
    };

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
                        disabled={exportando || cargando}
                        style={{ padding: '7px 16px', backgroundColor: '#6D28D9', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                    >
                        {exportando ? 'Exportando…' : '⬇️ Exportar CSV'}
                    </button>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0 0 0' }}>
                    {cargando ? 'Cargando datos…' : `${datos?.total_puntos ?? 0} reportes en el mapa de calor`}
                </p>
            </Card>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                {/* Mapa */}
                <div style={{ flex: 1 }}>
                    <div style={{ position: 'relative' }}>
                        <div ref={mapDivRef} style={{ height: '420px', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                        {cargando && (
                            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', zIndex: 10 }}>
                                <p style={{ color: '#6D28D9', fontWeight: '700', fontSize: '14px' }}>Cargando mapa de calor…</p>
                            </div>
                        )}
                    </div>
                    {/* Leyenda */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '6px 10px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Baja</span>
                        <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'linear-gradient(to right, #3B82F6, #22C55E, #EAB308, #F97316, #EF4444)' }} />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Alta</span>
                    </div>
                </div>

                {/* Panel lateral */}
                <div style={{ width: '190px', flexShrink: 0 }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', margin: '0 0 10px 0' }}>⚠️ Zonas críticas</h3>

                    {datos?.zonas_criticas.length === 0 && (
                        <p style={{ fontSize: '12px', color: '#94a3b8' }}>Sin zonas críticas con los filtros actuales.</p>
                    )}

                    {datos?.zonas_criticas.map((z, i) => (
                        <div key={i} onClick={() => mapRef.current?.setView([z.lat, z.lng], 13)}
                            style={{ padding: '8px', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer', backgroundColor: BG_CRIT[z.criticidad], border: `1px solid ${COLOR_CRIT[z.criticidad]}40` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: TXT_CRIT[z.criticidad] }}>{z.criticidad.toUpperCase()}</span>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>{z.total}</span>
                            </div>
                            <p style={{ fontSize: '11px', color: TXT_CRIT[z.criticidad], margin: 0, fontWeight: '600' }}>{z.nombre}</p>
                            <p style={{ fontSize: '10px', color: '#94a3b8', margin: '2px 0 0 0' }}>{z.pendientes} pendientes</p>
                        </div>
                    ))}

                    {datos && (
                        <div style={{ padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '4px' }}>
                            <p style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>📊 Resumen</p>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0' }}>Total: {datos.total_puntos}</p>
                        </div>
                    )}
                </div>
            </div>

            {!cargando && datos && <SuccessMessage mensaje="Mapa de calor con indicadores ambientales" />}
        </DemoShell>
    );
}
