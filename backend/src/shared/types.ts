// Roles canónicos del sistema
export type RolUsuario = 'Administrador' | 'Ciudadano';

// Estados canónicos de un reporte
export type EstadoReporte = 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Rechazado';

export interface Usuario {
    id:              string;
    nombre:          string;
    email:           string;
    password?:       string;
    rol:             RolUsuario;
    verificado:      boolean;
    fecha_registro:  string;
}

export interface Ubicacion {
    comuna:   string;
    latitud:  number;
    longitud: number;
}

export interface Reporte extends Ubicacion {
    id:             string;
    ciudadano_id:   string;
    codigo:         string;
    titulo:         string;
    descripcion?:   string;
    categoria?:     string;
    foto?:          string;
    fecha_creacion: string;
    estado:         EstadoReporte;
    direccion:      string;
}

export interface ValidacionReporte {
    id:              string;
    reporte_id:      string;
    usuario_id:      string;
    usuario_nombre?: string;
    fecha:           string;
    estado_asignado: EstadoReporte;
    comentario:      string;
}

export interface ComentarioInterno {
    id:              string;
    reporte_id:      string;
    admin_id:        string;
    admin_nombre?:   string;
    comentario:      string;
    fecha_creacion:  string;
}

export interface DetalleReporteResponse extends Reporte {
    historial_cambios:     ValidacionReporte[];
    comentarios_internos?: ComentarioInterno[];
    verificado_admin?:     boolean;
    confirmaciones?:       number;
}

export interface Notificacion {
    id:          string;
    usuario_id:  string;
    reporte_id?: string;
    mensaje:     string;
    tipo:        'Email' | 'Push' | 'Sistema';
    leida:       boolean;
    fecha_envio: string;
}

export interface JwtPayload {
    id:  string;
    rol: RolUsuario;
}

// Extiende Request de Express para incluir el usuario autenticado
declare global {
    namespace Express {
        interface Request {
            usuario?: JwtPayload;
        }
    }
}
