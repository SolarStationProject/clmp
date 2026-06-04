export const formatearFecha = (fechaStr: string): string => {
    const fecha = new Date(fechaStr);
    return `${fecha.getDate()} ${fecha.toLocaleDateString('es-ES', { month: 'long' })} ${fecha.getFullYear()}`;
};

export const formatearHora = (fechaStr: string): string => {
    const fecha = new Date(fechaStr);
    return `${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`;
};
