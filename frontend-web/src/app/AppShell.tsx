import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
    { ruta: '/app/mapa',          icono: '🗺️',  label: 'Mapa'         },
    { ruta: '/app/mis-reportes',  icono: '📋',  label: 'Mis reportes' },
    { ruta: '/app/perfil',        icono: '👤',  label: 'Perfil'       },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            height: '100dvh', fontFamily: 'system-ui, -apple-system, sans-serif',
            backgroundColor: '#f8fafc', overflow: 'hidden',
        }}>
            {/* Contenido principal */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {children}
            </div>

            {/* Bottom tabs */}
            <nav style={{
                height: '60px', backgroundColor: '#fff',
                borderTop: '1px solid #E2E8F0', display: 'flex',
                flexShrink: 0,
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}>
                {TABS.map(tab => {
                    const active = location.pathname.startsWith(tab.ruta);
                    return (
                        <button
                            key={tab.ruta}
                            onClick={() => navigate(tab.ruta)}
                            style={{
                                flex: 1, border: 'none', background: 'none',
                                cursor: 'pointer', display: 'flex',
                                flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', gap: '2px',
                                color: active ? '#005c2e' : '#94A3B8',
                                transition: 'color 0.15s',
                            }}
                        >
                            <span style={{ fontSize: '20px', lineHeight: 1 }}>{tab.icono}</span>
                            <span style={{ fontSize: '10px', fontWeight: active ? '700' : '400', letterSpacing: '0.01em' }}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
