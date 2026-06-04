import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAxios } from '../../../hooks/useAxios';
import { Reporte, EstadoReporte } from '../../../shared/types';
import { ICONS } from '../../../assets/icons';
import CitizenMapContainer from '../../../map/CitizenMapContainer';

type FiltroEstado = 'Todos' | EstadoReporte;
interface BackendResponse { success: boolean; data: Reporte[]; }

// HU005: Colores canónicos
const LEGEND: [EstadoReporte, string][] = [
    ['Pendiente',  '#EF4444'],
    ['En Proceso', '#F59E0B'],
    ['Resuelto',   '#22C55E'],
    ['Rechazado',  '#6B7280'],
];

export default function MapScreen() {
    const navigate = useNavigate();
    const [filtro,    setFiltro]    = useState<FiltroEstado>('Todos');
    const [seleccion, setSeleccion] = useState<string | null>(null);

    const usuarioId  = localStorage.getItem('cleanmap_uid') || 'c2222222-2222-2222-2222-222222222222';
    const usuarioRol = 'Ciudadano';

    const { data: respuesta, error } = useAxios<BackendResponse>('/api/reports/', { usuarioId, usuarioRol });
    const reportes = (respuesta?.data ?? []).filter(r => filtro === 'Todos' || r.estado === filtro);

    if (error) return <p style={{ padding: '16px', color: 'red' }}>Error: {error}</p>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', backgroundColor: '#F5F5F5', fontFamily: 'system-ui, sans-serif', overflow: 'hidden', userSelect: 'none' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#005c2e', padding: '42px 16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
                <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}><ICONS.ArrowLeft /></button>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Mapa de Reportes</h1>
                <div style={{ width: '22px' }} />
            </div>

            {/* Filtros */}
            <nav style={{ display: 'flex', gap: '8px', padding: '10px 16px', backgroundColor: '#fff', overflowX: 'auto', borderBottom: '1px solid #e2e8f0', scrollbarWidth: 'none' }}>
                {(['Todos', 'Pendiente', 'En Proceso', 'Resuelto', 'Rechazado'] as FiltroEstado[]).map(f => (
                    <button key={f} onClick={() => setFiltro(f)} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', backgroundColor: filtro === f ? '#005c2e' : '#EAEAEA', color: filtro === f ? '#fff' : '#555', fontWeight: filtro === f ? '600' : '400' }}>{f}</button>
                ))}
            </nav>

            {/* Mapa */}
            <main style={{ flex: 1, position: 'relative' }}>
                {/* Leyenda flotante */}
                <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(255,255,255,0.95)', padding: '8px 10px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 10 }}>
                    {LEGEND.map(([label, color]) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', fontSize: '11px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />{label}
                        </div>
                    ))}
                </div>

                {reportes.length > 0 ? (
                    <CitizenMapContainer
                        idReporteSeleccionado={seleccion}
                        onSelectMarker={setSeleccion}
                        reportesData={reportes}
                    />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                        No hay reportes cercanos
                    </div>
                )}
            </main>
        </div>
    );
}
