// Protege rutas según rol — check síncrono para evitar pantalla en blanco
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSession } from './useSession';

interface Props {
    rolRequerido: 'Administrador' | 'Ciudadano' | 'cualquiera';
    children: React.ReactNode;
}

export default function AuthGuard({ rolRequerido, children }: Props) {
    const location = useLocation();
    const sesion   = getSession(); // síncrono — lee localStorage al instante

    // Sin sesión → login
    if (!sesion) {
        return <Navigate to="/demo/hu002" replace state={{ from: location.pathname }} />;
    }

    // Rol incorrecto → login con aviso
    if (rolRequerido !== 'cualquiera' && sesion.rol !== rolRequerido) {
        return <Navigate to="/demo/hu002" replace state={{ from: location.pathname, rolRequerido }} />;
    }

    return <>{children}</>;
}
