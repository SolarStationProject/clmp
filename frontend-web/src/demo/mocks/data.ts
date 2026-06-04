export type EstadoReporte = 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Rechazado';

export const COLOR_ESTADO: Record<EstadoReporte, string> = {
    'Pendiente':  '#EF4444',
    'En Proceso': '#F59E0B',
    'Resuelto':   '#22C55E',
    'Rechazado':  '#6B7280',
};
export const BG_ESTADO: Record<EstadoReporte, string> = {
    'Pendiente':  '#FEE2E2',
    'En Proceso': '#FEF3C7',
    'Resuelto':   '#DCFCE7',
    'Rechazado':  '#F3F4F6',
};
export const TEXT_ESTADO: Record<EstadoReporte, string> = {
    'Pendiente':  '#B91C1C',
    'En Proceso': '#D97706',
    'Resuelto':   '#15803D',
    'Rechazado':  '#4B5563',
};

export interface MockReporte {
    id: string; codigo: string; titulo: string; descripcion: string;
    categoria: string; foto: string | null; fecha_creacion: string;
    estado: EstadoReporte; direccion: string; comuna: string;
    latitud: number; longitud: number; ciudadano: string;
}

export const MOCK_REPORTES: MockReporte[] = [
    { id: 'r1', codigo: 'CLM-2026-001', titulo: 'Basural en Av. Grecia', descripcion: 'Acumulación de escombros y desechos domiciliarios en la esquina.', categoria: 'Escombros', foto: null, fecha_creacion: '2026-05-10T10:30:00', estado: 'Pendiente',  direccion: 'Av. Grecia 1200', comuna: 'Ñuñoa',      latitud: -33.4650, longitud: -70.6120, ciudadano: 'María González' },
    { id: 'r2', codigo: 'CLM-2026-002', titulo: 'Microbasural en parque Santa Rosa', descripcion: 'Bolsas de basura abandonadas al interior del parque.', categoria: 'Residuos domiciliarios', foto: null, fecha_creacion: '2026-05-12T14:15:00', estado: 'En Proceso', direccion: 'Parque Santa Rosa, entrada norte', comuna: 'La Florida',  latitud: -33.5280, longitud: -70.5950, ciudadano: 'Carlos Pérez' },
    { id: 'r3', codigo: 'CLM-2026-003', titulo: 'Vertedero clandestino Cerro Navia', descripcion: 'Gran acumulación de muebles y residuos especiales.', categoria: 'Residuos especiales', foto: null, fecha_creacion: '2026-05-08T09:00:00', estado: 'Resuelto',   direccion: 'Paso a desnivel Américo Vespucio Norte', comuna: 'Cerro Navia', latitud: -33.4130, longitud: -70.7480, ciudadano: 'Ana Rodríguez' },
    { id: 'r4', codigo: 'CLM-2026-004', titulo: 'Escombros en calle Los Nogales', descripcion: 'Material de demolición dejado en la vía pública.', categoria: 'Escombros', foto: null, fecha_creacion: '2026-05-15T16:45:00', estado: 'Rechazado',  direccion: 'Los Nogales 456', comuna: 'Pudahuel',    latitud: -33.4450, longitud: -70.8020, ciudadano: 'Luis Martínez' },
    { id: 'r5', codigo: 'CLM-2026-005', titulo: 'Basura en ribera del Zanjón', descripcion: 'Acumulación periódica de desechos en la ribera sur.', categoria: 'Residuos domiciliarios', foto: null, fecha_creacion: '2026-05-18T11:20:00', estado: 'Pendiente',  direccion: 'Zanjón de la Aguada frente Av. Santa Rosa 4200', comuna: 'San Miguel',   latitud: -33.4980, longitud: -70.6480, ciudadano: 'María González' },
    { id: 'r6', codigo: 'CLM-2026-006', titulo: 'Aceites y residuos industriales', descripcion: 'Tambores con aceite quemado abandonados en calzada.', categoria: 'Residuos peligrosos', foto: null, fecha_creacion: '2026-05-20T08:00:00', estado: 'En Proceso', direccion: 'Av. Pajaritos 3800', comuna: 'Maipú',       latitud: -33.5100, longitud: -70.7850, ciudadano: 'Carlos Pérez' },
    { id: 'r7', codigo: 'CLM-2026-007', titulo: 'Basural en sitio eriazo La Pintana', descripcion: 'Microbasural en sitio eriazo de av. La Serena.', categoria: 'Residuos domiciliarios', foto: null, fecha_creacion: '2026-05-22T13:30:00', estado: 'Pendiente',  direccion: 'Av. La Serena 1800, sitio eriazo', comuna: 'La Pintana',  latitud: -33.5720, longitud: -70.6280, ciudadano: 'Ana Rodríguez' },
    { id: 'r8', codigo: 'CLM-2026-008', titulo: 'Neumáticos abandonados Quilicura', descripcion: 'Más de 20 neumáticos abandonados en la berma.', categoria: 'Residuos especiales', foto: null, fecha_creacion: '2026-05-05T07:00:00', estado: 'Resuelto',   direccion: 'Ruta 5 Norte, berma sur km 14', comuna: 'Quilicura',    latitud: -33.3620, longitud: -70.7230, ciudadano: 'Luis Martínez' },
];

export interface MockHistorial {
    id: string; estado_asignado: EstadoReporte; comentario: string;
    fecha: string; usuario_nombre: string;
}

export const HISTORIAL_R2: MockHistorial[] = [
    { id: 'h1', estado_asignado: 'Pendiente',  comentario: 'Reporte recibido y validado por sistema.', fecha: '2026-05-12T14:15:00', usuario_nombre: 'Sistema' },
    { id: 'h2', estado_asignado: 'En Proceso', comentario: 'Asignado a equipo de limpieza zona sur. Retiro programado para el jueves.', fecha: '2026-05-13T09:00:00', usuario_nombre: 'Administrador CleanMap' },
];

export const HISTORIAL_R3: MockHistorial[] = [
    { id: 'h3', estado_asignado: 'Pendiente',  comentario: 'Reporte recibido y validado por sistema.', fecha: '2026-05-08T09:00:00', usuario_nombre: 'Sistema' },
    { id: 'h4', estado_asignado: 'En Proceso', comentario: 'Coordinado retiro con empresa contratista municipal.', fecha: '2026-05-09T11:30:00', usuario_nombre: 'Administrador CleanMap' },
    { id: 'h5', estado_asignado: 'Resuelto',   comentario: 'Sector limpiado completamente. Señalética preventiva instalada.', fecha: '2026-05-11T16:00:00', usuario_nombre: 'Administrador CleanMap' },
];

export const MOCK_USUARIOS = [
    { email: 'admin@cleanmap.cl',    password: 'Admin1234!',     rol: 'Administrador', nombre: 'Administrador CleanMap' },
    { email: 'maria@ciudadano.cl',   password: 'Ciudadano123!',  rol: 'Ciudadano',     nombre: 'María González' },
    { email: 'carlos@ciudadano.cl',  password: 'Ciudadano123!',  rol: 'Ciudadano',     nombre: 'Carlos Pérez' },
];

export const REPORTES_CIUDADANO = MOCK_REPORTES.filter(r => r.ciudadano === 'María González');

export const CATEGORIAS = ['Escombros', 'Residuos domiciliarios', 'Residuos especiales', 'Residuos peligrosos', 'Otro'];
