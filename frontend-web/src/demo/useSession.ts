// URL base del backend — usa variable de entorno en producción, proxy en desarrollo
export const API_BASE = import.meta.env.VITE_API_URL || '';

// Hook centralizado de sesión — lee localStorage
export interface Session {
    token:  string;
    uid:    string;
    rol:    'Administrador' | 'Ciudadano';
    nombre: string;
}

export function getSession(): Session | null {
    const token  = localStorage.getItem('cleanmap_token');
    const uid    = localStorage.getItem('cleanmap_uid');
    const rol    = localStorage.getItem('cleanmap_rol') as Session['rol'] | null;
    const nombre = localStorage.getItem('cleanmap_nombre');
    if (!token || !uid || !rol || !nombre) return null;
    return { token, uid, rol, nombre };
}

export function clearSession(): void {
    ['cleanmap_token','cleanmap_uid','cleanmap_rol','cleanmap_nombre'].forEach(k => localStorage.removeItem(k));
}
