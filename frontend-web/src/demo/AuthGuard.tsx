// Redirige a HU002 (login) si no hay sesión activa con el rol requerido
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, Session } from './useSession';

interface Props {
    rolRequerido: 'Administrador' | 'Ciudadano' | 'cualquiera';
    children: React.ReactNode;
}

export default function AuthGuard({ rolRequerido, children }: Props) {
    const navigate = useNavigate();
    const [sesion,   setSesion]   = useState<Session | null | 'cargando'>('cargando');

    useEffect(() => {
        const s = getSession();

        if (!s) {
            navigate('/demo/hu002', { replace: true, state: { from: window.location.pathname } });
            return;
        }

        if (rolRequerido !== 'cualquiera' && s.rol !== rolRequerido) {
            navigate('/demo/hu002', { replace: true, state: { from: window.location.pathname, rolRequerido } });
            return;
        }

        setSesion(s);
    }, []);

    if (sesion === 'cargando') return null;
    return <>{children}</>;
}
