export const formatearFecha = (fechaStr: string): string => {
    const fecha = new Date(fechaStr);
    const dia   = fecha.getDate();
    const mes   = fecha.toLocaleDateString('es-ES', { month: 'long' });
    const anio  = fecha.getFullYear();
    return `${dia} ${mes} ${anio}`;
};

export const formatearHora = (fechaStr: string): string => {
    const fecha    = new Date(fechaStr);
    const horas    = fecha.getHours().toString().padStart(2, '0');
    const minutos  = fecha.getMinutes().toString().padStart(2, '0');
    return `${horas}:${minutos}`;
};
