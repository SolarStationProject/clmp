import { useNavigate, useLocation } from 'react-router-dom';

const NAV = [
    { ruta: '/admin',                icono: '📊', label: 'Dashboard'        },
    { ruta: '/admin/reportes',       icono: '📋', label: 'Reportes'         },
    { ruta: '/admin/mapa',           icono: '🗺️',  label: 'Mapa de calor'   },
    { ruta: '/admin/verificar',      icono: '🔍', label: 'Verificar fotos'  },
    { ruta: '/admin/notificaciones', icono: '🔔', label: 'Notificaciones'   },
    { ruta: '/admin/exportar',       icono: '📤', label: 'Exportar CSV'     },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();

    const nombre = localStorage.getItem('cleanmap_nombre') || 'Administrador';
    const iniciales = nombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

    const handleLogout = () => {
        localStorage.removeItem('cleanmap_token');
        localStorage.removeItem('cleanmap_uid');
        localStorage.removeItem('cleanmap_rol');
        localStorage.removeItem('cleanmap_nombre');
        navigate('/login', { replace: true });
    };

    const paginaActual = NAV.find(n =>
        n.ruta === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(n.ruta)
    )?.label ?? 'Panel de administración';

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc' }}>

            {/* ── Sidebar ── */}
            <aside style={{
                width: '240px', flexShrink: 0,
                backgroundColor: '#fff', borderRight: '1px solid #E2E8F0',
                display: 'flex', flexDirection: 'column',
            }}>
                {/* Logo */}
                <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#005c2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🗺️</div>
                        <div>
                            <p style={{ fontSize: '15px', fontWeight: '800', color: '#1E293B', margin: 0 }}>CleanMap</p>
                            <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>Portal admin</p>
                        </div>
                    </div>
                </div>

                {/* Navegación */}
                <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {NAV.map(item => {
                        const active = item.ruta === '/admin'
                            ? location.pathname === '/admin'
                            : location.pathname.startsWith(item.ruta);
                        return (
                            <button key={item.ruta} onClick={() => navigate(item.ruta)} style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '10px 12px', borderRadius: '10px', border: 'none',
                                backgroundColor: active ? '#F0FDF4' : 'transparent',
                                color: active ? '#005c2e' : '#64748B',
                                fontWeight: active ? '700' : '400',
                                fontSize: '14px', cursor: 'pointer', textAlign: 'left',
                                width: '100%', fontFamily: 'inherit',
                                transition: 'background-color 0.1s',
                            }}>
                                <span style={{ fontSize: '16px', width: '20px', textAlign: 'center', flexShrink: 0 }}>{item.icono}</span>
                                {item.label}
                                {active && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#005c2e' }} />}
                            </button>
                        );
                    })}
                </nav>

                {/* Perfil + logout */}
                <div style={{ padding: '12px 10px', borderTop: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', marginBottom: '4px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#005c2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>{iniciales}</span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nombre}</p>
                            <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>Administrador</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} style={{
                        width: '100%', padding: '9px 12px', borderRadius: '10px', border: 'none',
                        backgroundColor: '#FEF2F2', color: '#EF4444',
                        fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit',
                    }}>
                        <span>🚪</span> Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* ── Área principal ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Header */}
                <header style={{
                    height: '60px', backgroundColor: '#fff', borderBottom: '1px solid #E2E8F0',
                    display: 'flex', alignItems: 'center', padding: '0 28px',
                    flexShrink: 0,
                }}>
                    <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B', margin: 0 }}>{paginaActual}</h1>
                </header>

                {/* Contenido */}
                <main style={{ flex: 1, overflowY: 'auto', padding: '28px', backgroundColor: '#f8fafc' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
