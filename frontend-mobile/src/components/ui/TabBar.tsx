import { useNavigate } from 'react-router-dom';
import { ICONS } from '../../assets/icons';

interface TabBarProps { currentTab: string; }

const tabs = [
    { id: 'home',       label: 'Inicio',      icon: ICONS.Home },
    { id: 'map',        label: 'Mapa',         icon: ICONS.Map },
    { id: 'new-report', label: 'Reportar',     icon: ICONS.Plus, isCenter: true },
    { id: 'my-reports', label: 'Mis reportes', icon: ICONS.FileText },
    { id: 'profile',    label: 'Perfil',       icon: ICONS.User },
];

export default function TabBar({ currentTab }: TabBarProps) {
    const navigate = useNavigate();
    const go = (id: string) => {
        switch (id) {
            case 'home':       navigate('/home');       break;
            case 'my-reports': navigate('/my-reports'); break;
            case 'map':
            case 'new-report': navigate('/map');        break;
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 'calc(76px + env(safe-area-inset-bottom, 0px))', backgroundColor: '#fff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', boxShadow: '0 -4px 16px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 8px', zIndex: 1000, fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            {tabs.map(tab => {
                const isActive = currentTab === tab.id;
                if (tab.isCenter) return (
                    <div key={tab.id} style={{ position: 'relative', width: '60px', height: '60px' }}>
                        <button onClick={() => go(tab.id)} style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#005c2e', color: '#fff', border: '1px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,92,46,0.3)', cursor: 'pointer', padding: 0 }}>
                            <tab.icon />
                        </button>
                    </div>
                );
                return (
                    <button key={tab.id} onClick={() => go(tab.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', width: '60px', height: '100%', cursor: 'pointer', padding: '4px 0', color: isActive ? '#005c2e' : '#94a3b8' }}>
                        <tab.icon />
                        <span style={{ fontSize: '12px', fontWeight: isActive ? '700' : '500', whiteSpace: 'nowrap' }}>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
