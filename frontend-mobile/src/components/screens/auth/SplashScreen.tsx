import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../../../assets/images';

export default function SplashScreen() {
    const navigate = useNavigate();
    useEffect(() => {
        const t = setTimeout(() => navigate('/home'), 3000);
        return () => clearTimeout(t);
    }, [navigate]);

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#005c2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}>
            <img src={IMAGES.logo} alt="CleanMap" style={{ width: '180px', height: 'auto', borderRadius: '24px' }} />
            <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '24px', fontSize: '14px', fontFamily: 'system-ui, sans-serif' }}>Gestión de microbasurales</p>
        </div>
    );
}
