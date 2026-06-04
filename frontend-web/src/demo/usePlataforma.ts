// Detecta si el dispositivo es móvil o escritorio
export function detectarPlataforma(): 'movil' | 'web' {
    const ua = navigator.userAgent;
    const esMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
        (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
    return esMobile ? 'movil' : 'web';
}

export function labelPlataforma(p: 'movil' | 'web') {
    return p === 'movil' ? '📱 Móvil' : '🖥️ Web';
}
