// HU018: Mapa de calor ambiental — convertido de .jsx a .tsx, estados canónicos actualizados
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../services/api';

const COLOR_CRIT: Record<string, string> = { alta: '#ef4444', media: '#f97316', baja: '#eab308' };
const BG_CRIT:    Record<string, string> = { alta: '#fef2f2', media: '#fff7ed', baja: '#fefce8' };
const TXT_CRIT:   Record<string, string> = { alta: '#991b1b', media: '#9a3412', baja: '#854d0e' };

interface HeatMapPoint   { lat: number; lng: number; intensity: number; }
interface ZonaCritica    { nombre: string; lat: number; lng: number; total: number; pendientes: number; criticidad: 'alta'|'media'|'baja'; }
interface HeatMapData    { puntos_calor: HeatMapPoint[]; zonas_criticas: ZonaCritica[]; total_puntos: number; }
interface Filtros        { estado: string; fecha_desde: string; fecha_hasta: string; }

export default function HeatMapPage() {
    const navigate     = useNavigate();
    const mapDivRef    = useRef<HTMLDivElement>(null);
    const mapRef       = useRef<any>(null);
    const heatRef      = useRef<any>(null);
    const markersRef   = useRef<any[]>([]);

    const [datos,      setDatos]      = useState<HeatMapData | null>(null);
    const [cargando,   setCargando]   = useState(true);
    const [error,      setError]      = useState<string | null>(null);
    const [exportando, setExportando] = useState(false);
    const [filtros,    setFiltros]    = useState<Filtros>({ estado: '', fecha_desde: '', fecha_hasta: '' });

    const cargarDatos = async (f: Filtros) => {
        setCargando(true);
        setError(null);
        try {
            const token  = localStorage.getItem('cleanmap_token') || '';
            const params = new URLSearchParams();
            if (f.estado)      params.append('estado',      f.estado);
            if (f.fecha_desde) params.append('fecha_desde', f.fecha_desde);
            if (f.fecha_hasta) params.append('fecha_hasta', f.fecha_hasta);

            const res = await fetch(`${API_URL}/api/heatmap?${params}`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Error del servidor');
            setDatos(await res.json());
        } catch (e: any) {
            setError(e.message);
        } finally {
            setCargando(false);
        }
    };

    // Inicializar mapa Leaflet con CDN
    useEffect(() => {
        if (mapRef.current || !mapDivRef.current) return;

        const loadLeaflet = () => {
            const L = (window as any).L;
            if (!L) return;

            const map = L.map(mapDivRef.current, { center: [-33.4489, -70.6693], zoom: 11 });
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(map);
            mapRef.current = map;
            cargarDatos(filtros);
        };

        if ((window as any).L) { loadLeaflet(); return; }
        const css = document.createElement('link');
        css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);

        const script1 = document.createElement('script');
        script1.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script1.onload = () => {
            const script2 = document.createElement('script');
            script2.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
            script2.onload = loadLeaflet;
            document.body.appendChild(script2);
        };
        document.body.appendChild(script1);
    }, []);

    // Actualizar capas cuando llegan datos
    useEffect(() => {
        const L = (window as any).L;
        if (!L || !mapRef.current || !datos) return;

        // Remover capas anteriores
        if (heatRef.current) mapRef.current.removeLayer(heatRef.current);
        markersRef.current.forEach(m => mapRef.current.removeLayer(m));
        markersRef.current = [];

        // Capa de calor
        const puntos = datos.puntos_calor.map(p => [p.lat, p.lng, p.intensity]);
        heatRef.current = (L as any).heatLayer(puntos, { radius: 25, blur: 20, gradient: { 0.2: 'blue', 0.4: 'cyan', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' } }).addTo(mapRef.current);

        // Marcadores de zonas críticas
        datos.zonas_criticas.forEach(z => {
            const radio = z.criticidad === 'alta' ? 14 : z.criticidad === 'media' ? 10 : 7;
            const marker = L.circleMarker([z.lat, z.lng], { radius: radio, fillColor: COLOR_CRIT[z.criticidad], color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.9 }).addTo(mapRef.current);
            marker.bindPopup(`<b>${z.criticidad.toUpperCase()}</b><br>${z.total} reportes (${z.pendientes} pendientes)`);
            markersRef.current.push(marker);
        });
    }, [datos]);

    const exportarCSV = async () => {
        setExportando(true);
        try {
            const token = localStorage.getItem('cleanmap_token') || '';
            const res = await fetch(`${API_URL}/api/heatmap/exportar`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Error al exportar');
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href = url; a.download = `cleanmap_calor_${new Date().toISOString().slice(0,10)}.csv`;
            a.click(); URL.revokeObjectURL(url);
        } catch (e: any) { alert(e.message); }
        finally { setExportando(false); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#005c2e', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }}>
                <button onClick={() => navigate('/map')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>←</button>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Indicadores Ambientales</h1>
            </div>

            {/* Barra de filtros */}
            <div style={{ backgroundColor: '#fff', padding: '10px 16px', display: 'flex', gap: '10px', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
                <select value={filtros.estado} onChange={e => setFiltros(f => ({ ...f, estado: e.target.value }))} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <option value="">Todos los estados</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Resuelto">Resuelto</option>
                    <option value="Rechazado">Rechazado</option>
                </select>
                <input type="date" value={filtros.fecha_desde} onChange={e => setFiltros(f => ({ ...f, fecha_desde: e.target.value }))} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                <input type="date" value={filtros.fecha_hasta} onChange={e => setFiltros(f => ({ ...f, fecha_hasta: e.target.value }))} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                <button onClick={() => cargarDatos(filtros)} style={{ padding: '6px 14px', backgroundColor: '#005c2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Aplicar</button>
                <button onClick={() => { const f = { estado: '', fecha_desde: '', fecha_hasta: '' }; setFiltros(f); cargarDatos(f); }} style={{ padding: '6px 14px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Limpiar</button>
                <button onClick={exportarCSV} disabled={exportando} style={{ padding: '6px 14px', backgroundColor: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', marginLeft: 'auto' }}>
                    {exportando ? 'Exportando…' : 'Exportar CSV'}
                </button>
            </div>

            {/* Contenido principal */}
            <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
                {/* Mapa */}
                <div style={{ flex: 1, position: 'relative' }}>
                    <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
                    {cargando && (
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                            Cargando datos…
                        </div>
                    )}
                    {error && (
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                            <p style={{ color: '#ef4444' }}>{error}</p>
                            <button onClick={() => cargarDatos(filtros)} style={{ padding: '8px 16px', backgroundColor: '#005c2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Reintentar</button>
                        </div>
                    )}
                </div>

                {/* Panel lateral */}
                {datos && datos.zonas_criticas.length > 0 && (
                    <div style={{ width: '260px', backgroundColor: '#fff', borderLeft: '1px solid #e2e8f0', overflowY: 'auto', padding: '16px' }}>
                        <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: '0 0 12px 0' }}>Zonas Críticas</h2>
                        {datos.zonas_criticas.map((z, i) => (
                            <div key={i} onClick={() => mapRef.current?.setView([z.lat, z.lng], 14)} style={{ padding: '10px', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer', backgroundColor: BG_CRIT[z.criticidad], border: `1px solid ${COLOR_CRIT[z.criticidad]}30` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: TXT_CRIT[z.criticidad] }}>{z.criticidad.toUpperCase()}</span>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>{z.total} reportes</span>
                                </div>
                                <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>{z.pendientes} pendientes</p>
                            </div>
                        ))}
                        {datos.total_puntos > 0 && (
                            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '16px' }}>Total: {datos.total_puntos} puntos analizados</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
