import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAxios } from '../../hooks/useAxios';
import { Reporte, EstadoReporte } from '../../shared/types';
import { ICONS } from '../../assets/icons';
import CitizenMapContainer from '../../map/CitizenMapContainer';

type FiltroEstado = 'Todos' | EstadoReporte;

interface BackendResponse { status: string; data: Reporte[]; }

export default function MapPage() {
    const navigate = useNavigate();
    const [filtro,          setFiltro]          = useState<FiltroEstado>('Todos');
    const [reporteSeleccionado, setReporteSeleccionado] = useState<string | null>(null);

    const usuarioId  = localStorage.getItem('cleanmap_uid')  || 'a1111111-1111-1111-1111-111111111111';
    const usuarioRol = localStorage.getItem('cleanmap_rol')  || 'Administrador';

    const { data: respuesta, error } = useAxios<BackendResponse>('/api/reports/', { usuarioId, usuarioRol });

    const reportes = (respuesta?.data ?? []).filter(r => filtro === 'Todos' || r.estado === filtro);

    if (error) return <p style={{ padding: '16px', color: 'red' }}>Error al conectar con el servidor: {error}</p>;

    const filtros: FiltroEstado[] = ['Todos', 'Pendiente', 'En Proceso', 'Resuelto', 'Rechazado'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#005c2e', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Mapa de Reportes</h1>
                <button onClick={() => navigate('/heatmap')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    Indicadores
                </button>
            </div>

            {/* Filtros */}
            <nav style={{ display: 'flex', gap: '8px', padding: '10px 16px', backgroundColor: '#fff', overflowX: 'auto', borderBottom: '1px solid #e2e8f0', scrollbarWidth: 'none' }}>
                {filtros.map(f => (
                    <button key={f} onClick={() => setFiltro(f)} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', backgroundColor: filtro === f ? '#005c2e' : '#EAEAEA', color: filtro === f ? '#fff' : '#555', fontWeight: filtro === f ? '600' : '400' }}>
                        {f}
                    </button>
                ))}
            </nav>

            {/* Mapa */}
            <main style={{ flex: 1, position: 'relative' }}>
                {/* Leyenda */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(255,255,255,0.95)', padding: '8px 12px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 10, fontSize: '12px' }}>
                    {([['Pendiente','#EF4444'],['En Proceso','#F59E0B'],['Resuelto','#22C55E'],['Rechazado','#6B7280']] as [string,string][]).map(([label, color]) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
                            {label}
                        </div>
                    ))}
                </div>

                {reportes.length > 0 ? (
                    <CitizenMapContainer
                        idReporteSeleccionado={reporteSeleccionado}
                        onSelectMarker={setReporteSeleccionado}
                        reportesData={reportes}
                    />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                        No hay reportes para mostrar
                    </div>
                )}
            </main>
        </div>
    );
}
