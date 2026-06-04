export type RolUsuario    = 'Administrador' | 'Ciudadano';
export type EstadoReporte = 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Rechazado';

export interface Usuario {
    id:             string;
    nombre:         string;
    email:          string;
    rol:            RolUsuario;
    verificado:     boolean;
    fecha_registro: string;
}

export interface Reporte {
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
    comuna:         string;
    latitud:        number;
    longitud:       number;
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
    id:             string;
    reporte_id:     string;
    admin_id:       string;
    admin_nombre?:  string;
    comentario:     string;
    fecha_creacion: string;
}

export interface DetalleReporteResponse extends Reporte {
    historial_cambios:     ValidacionReporte[];
    comentarios_internos?: ComentarioInterno[];
}
