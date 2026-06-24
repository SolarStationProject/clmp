import { useNavigate } from 'react-router-dom';

export default function PerfilScreen() {
    const navigate = useNavigate();

    const nombre = localStorage.getItem('cleanmap_nombre') || 'Usuario';
    const uid    = localStorage.getItem('cleanmap_uid')    || '';

    const handleLogout = () => {
        localStorage.removeItem('cleanmap_token');
        localStorage.removeItem('cleanmap_uid');
        localStorage.removeItem('cleanmap_rol');
        localStorage.removeItem('cleanmap_nombre');
        navigate('/login', { replace: true });
    };

    const iniciales = nombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* Header */}
            <div style={{ backgroundColor: '#005c2e', padding: '24px 16px 40px', flexShrink: 0 }}>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>Perfil</h1>
            </div>

            {/* Avatar card */}
            <div style={{ margin: '-24px 16px 0', backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#005c2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{iniciales}</span>
                </div>
                <div>
                    <p style={{ fontSize: '17px', fontWeight: '800', color: '#1E293B', margin: '0 0 2px 0' }}>{nombre}</p>
                    <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>Ciudadano · Providencia</p>
                </div>
            </div>

            {/* Info */}
            <div style={{ margin: '16px', backgroundColor: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                {[
                    ['👤 ID de usuario', uid.slice(0, 8) + '…'],
                    ['🏙️ Comuna', 'Providencia'],
                    ['🗺️ Aplicación', 'CleanMap v1.0'],
                ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ fontSize: '14px', color: '#64748B' }}>{label}</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{val}</span>
                    </div>
                ))}
            </div>

            {/* Acciones */}
            <div style={{ margin: '0 16px', backgroundColor: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <button onClick={() => navigate('/app/mis-reportes')} style={{ width: '100%', padding: '16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '14px', color: '#1E293B' }}>📋 Mis reportes</span>
                    <span style={{ color: '#94A3B8' }}>›</span>
                </button>
                <button onClick={() => navigate('/app/crear')} style={{ width: '100%', padding: '16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#1E293B' }}>📍 Crear nuevo reporte</span>
                    <span style={{ color: '#94A3B8' }}>›</span>
                </button>
            </div>

            {/* Cerrar sesión */}
            <div style={{ margin: '16px' }}>
                <button onClick={handleLogout} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: '#FEF2F2', color: '#EF4444', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                    Cerrar sesión
                </button>
            </div>
        </div>
    );
}
