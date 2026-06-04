import React from 'react';
import { useNavigate } from 'react-router-dom';

const HUS = [
    { id: 'HU001', ruta: '/demo/hu001', integrante: 'Stefani',    color: '#7C3AED', bg: '#F5F3FF', titulo: 'Registro de Usuarios',           descripcion: 'Formulario de registro con validación de email, contraseña segura y código de verificación.' },
    { id: 'HU002', ruta: '/demo/hu002', integrante: 'Stefani',    color: '#7C3AED', bg: '#F5F3FF', titulo: 'Iniciar Sesión',                  descripcion: 'Login con JWT, bloqueo tras 5 intentos fallidos y sesión de 7 días.' },
    { id: 'HU003', ruta: '/demo/hu003', integrante: 'Stefani',    color: '#7C3AED', bg: '#F5F3FF', titulo: 'Recuperar Contraseña',             descripcion: 'Enlace temporal de 1 hora y formulario para nueva contraseña.' },
    { id: 'HU004', ruta: '/demo/hu004', integrante: 'Jaime',      color: '#0EA5E9', bg: '#F0F9FF', titulo: 'Crear Reporte con Foto y GPS',    descripcion: 'Formulario con cámara, GPS automático, categoría y estado inicial Pendiente.' },
    { id: 'HU005', ruta: '/demo/hu005', integrante: 'William',    color: '#059669', bg: '#ECFDF5', titulo: 'Mapa Interactivo de Reportes',    descripcion: 'Marcadores de colores por estado, click para ver detalle, zoom y filtros.' },
    { id: 'HU006', ruta: '/demo/hu006', integrante: 'Alex',       color: '#DC2626', bg: '#FEF2F2', titulo: 'Cambiar Estado de Reportes',      descripcion: 'Admin selecciona reporte, cambia estado y notifica al ciudadano en < 30 s.' },
    { id: 'HU007', ruta: '/demo/hu007', integrante: 'Alex',       color: '#DC2626', bg: '#FEF2F2', titulo: 'Control de Acceso por Plataforma','descripcion': 'Admin solo en web, ciudadano solo en móvil. Roles con JWT.' },
    { id: 'HU009', ruta: '/demo/hu009', integrante: 'Jaime',      color: '#0EA5E9', bg: '#F0F9FF', titulo: 'Geolocalización Automática GPS',  descripcion: 'Captura coordenadas, muestra marcador en mapa y alerta si precisión > 50m.' },
    { id: 'HU010', ruta: '/demo/hu010', integrante: 'Julián',     color: '#D97706', bg: '#FFFBEB', titulo: 'Consultar Estado de Reportes',    descripcion: 'Lista de mis reportes con historial de cambios y notificaciones de estado.' },
    { id: 'HU018', ruta: '/demo/hu018', integrante: 'Martín',     color: '#6D28D9', bg: '#FAF5FF', titulo: 'Indicadores Ambientales por Zona','descripcion': 'Mapa de calor de microbasurales, zonas críticas y exportación CSV.' },
    { id: 'HU021', ruta: '/demo/hu021', integrante: 'Julián',     color: '#D97706', bg: '#FFFBEB', titulo: 'Consultar Detalles de Reporte',   descripcion: 'Detalle completo: foto, descripción, ubicación, historial. Admin ve notas internas.' },
];

const COLORES_INTEGRANTE: Record<string, string> = {
    Stefani: '#7C3AED', Alex: '#DC2626', Julián: '#D97706',
    William: '#059669', Martín: '#6D28D9', Jaime: '#0EA5E9',
};

export default function DemoIndex() {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #005c2e 0%, #0a7c40 100%)', padding: '48px 24px 56px', textAlign: 'center', color: '#fff' }}>
                <div style={{ width: '72px', height: '72px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '36px' }}>
                    🗺️
                </div>
                <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>CleanMap</h1>
                <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', margin: '0 0 4px 0' }}>Sistema de Gestión de Microbasurales</p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Universidad Andrés Bello — Demo Solemne 2026</p>

                {/* Leyenda de integrantes */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                    {Object.entries(COLORES_INTEGRANTE).map(([nombre, color]) => (
                        <span key={nombre} style={{ padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: `${color}30`, color: '#fff', border: `1px solid ${color}60` }}>
                            {nombre}
                        </span>
                    ))}
                </div>
            </div>

            {/* Contador */}
            <div style={{ maxWidth: '960px', margin: '-28px auto 0', padding: '0 16px' }}>
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-around', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '32px' }}>
                    {[['11', 'Historias de usuario'], ['6', 'Integrantes'], ['3', 'Módulos'], ['2', 'Plataformas']].map(([n, label]) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '28px', fontWeight: '800', color: '#005c2e', margin: 0 }}>{n}</p>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid de HUs */}
            <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 16px 48px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 20px 0' }}>
                    Historias de Usuario — Haz click en cualquier tarjeta para probarla
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {HUS.map(hu => (
                        <div
                            key={hu.id}
                            onClick={() => navigate(hu.ruta)}
                            style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${hu.color}20`, transition: 'transform 0.15s, box-shadow 0.15s', position: 'relative', overflow: 'hidden' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                        >
                            {/* Barra de color superior */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: hu.color }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', marginTop: '4px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '800', color: hu.color, backgroundColor: hu.bg, padding: '4px 10px', borderRadius: '8px' }}>{hu.id}</span>
                                <span style={{ fontSize: '11px', color: '#fff', backgroundColor: COLORES_INTEGRANTE[hu.integrante] || '#64748b', padding: '3px 10px', borderRadius: '8px', fontWeight: '600' }}>{hu.integrante}</span>
                            </div>

                            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0', lineHeight: '1.3' }}>{hu.titulo}</h3>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.5' }}>{hu.descripcion}</p>

                            <button style={{ width: '100%', padding: '9px', backgroundColor: hu.color, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                                Probar HU →
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
