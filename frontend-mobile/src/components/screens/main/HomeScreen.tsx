import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../../../assets/images';
import { ICONS } from '../../../assets/icons';
import TabBar from '../../ui/TabBar';

const menuItems = [
    { id: 'new-report',     icon: ICONS.Plus,     label: 'Nuevo Reporte',    description: 'Reportar vertedero ilegal',  accent: true },
    { id: 'my-reports',     icon: ICONS.FileText, label: 'Mis Reportes',     description: 'Ver estado de tus reportes', badge: 0 },
    { id: 'map',            icon: ICONS.MapPin,   label: 'Mapa de Reportes', description: 'Explorar reportes cercanos' },
    { id: 'notifications',  icon: ICONS.Bell,     label: 'Notificaciones',   description: 'Alertas y actualizaciones' },
];

export default function HomeScreen() {
    const navigate = useNavigate();
    const go = (id: string) => {
        if (id === 'home')       navigate('/home');
        else if (id === 'my-reports') navigate('/my-reports');
        else                     navigate('/map');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', userSelect: 'none', fontFamily: 'system-ui, sans-serif' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#005c2e', padding: '40px 16px 36px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                            <img src={IMAGES.logo} alt="CleanMap" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <div>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Bienvenido</p>
                            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>CleanMap</h2>
                        </div>
                    </div>
                    <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', position: 'relative' }}>
                        <ICONS.Bell />
                        <span style={{ position: 'absolute', top: '0', right: '0', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }} />
                    </button>
                </div>

                {/* Resumen */}
                <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '14px 16px', display: 'flex', justifyContent: 'space-around' }}>
                    {[['Pendientes', '3', '#EF4444'], ['En Proceso', '2', '#F59E0B'], ['Resueltos', '5', '#22C55E']].map(([label, n, color]) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0 }}>{n}</p>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', margin: '2px 0 0 0' }}>{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Menú */}
            <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>Acciones rápidas</h3>
                {menuItems.map(item => (
                    <button key={item.id} onClick={() => go(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', backgroundColor: item.accent ? '#005c2e' : '#fff', borderRadius: '18px', border: 'none', cursor: 'pointer', textAlign: 'left', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', position: 'relative' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '14px', backgroundColor: item.accent ? 'rgba(255,255,255,0.2)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.accent ? '#fff' : '#005c2e', flexShrink: 0 }}>
                            <item.icon />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '15px', fontWeight: '700', color: item.accent ? '#fff' : '#1e293b', margin: 0 }}>{item.label}</h4>
                            <p style={{ fontSize: '12px', color: item.accent ? 'rgba(255,255,255,0.75)' : '#64748b', margin: '2px 0 0 0' }}>{item.description}</p>
                        </div>
                        <div style={{ color: item.accent ? 'rgba(255,255,255,0.6)' : '#cbd5e1' }}><ICONS.ChevronRight /></div>
                    </button>
                ))}
                <div style={{ height: 'calc(80px + env(safe-area-inset-bottom, 0px))' }} />
            </div>

            <TabBar currentTab="home" />
        </div>
    );
}
