-- CleanMap - Esquema unificado de base de datos
-- Roles canónicos: 'Administrador', 'Ciudadano'
-- Estados canónicos: 'Pendiente', 'En Proceso', 'Resuelto', 'Rechazado'

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS comentarios_internos CASCADE;
DROP TABLE IF EXISTS validacion_reportes CASCADE;
DROP TABLE IF EXISTS notificaciones CASCADE;
DROP TABLE IF EXISTS intentos_login CASCADE;
DROP TABLE IF EXISTS tokens_verificacion CASCADE;
DROP TABLE IF EXISTS reportes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Tabla de Usuarios
CREATE TABLE usuarios (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre          VARCHAR(100) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password        VARCHAR(255) NOT NULL,
    rol             VARCHAR(50) NOT NULL CHECK (rol IN ('Administrador', 'Ciudadano')),
    verificado      BOOLEAN DEFAULT FALSE NOT NULL,
    fecha_registro  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tabla de Tokens de Verificación (HU001: código 6 dígitos, HU003: token reset)
CREATE TABLE tokens_verificacion (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       VARCHAR(255) NOT NULL,
    token       VARCHAR(100) NOT NULL,
    tipo        VARCHAR(20)  NOT NULL CHECK (tipo IN ('registro', 'recuperacion')),
    expira_en   TIMESTAMP WITH TIME ZONE NOT NULL,
    usado       BOOLEAN DEFAULT FALSE NOT NULL,
    creado_en   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX tokens_email_tipo_idx ON tokens_verificacion (email, tipo, usado);

-- Tabla de Intentos de Login (para HU002: bloqueo tras 5 intentos en 15 min)
CREATE TABLE intentos_login (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       VARCHAR(255) NOT NULL,
    fecha       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX intentos_login_email_fecha_idx ON intentos_login (email, fecha);

-- Tabla de Reportes
CREATE TABLE reportes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ciudadano_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo          VARCHAR(50) NOT NULL,
    titulo          TEXT,
    descripcion     TEXT,
    categoria       VARCHAR(100),
    foto            TEXT,
    fecha_creacion  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    estado          VARCHAR(50) NOT NULL DEFAULT 'Pendiente'
                        CHECK (estado IN ('Pendiente', 'En Proceso', 'Resuelto', 'Rechazado')),
    direccion       VARCHAR(255) NOT NULL,
    comuna          VARCHAR(100) NOT NULL,
    geom            geometry(Point, 4326) NOT NULL
);
CREATE INDEX reportes_geom_idx ON reportes USING gist(geom);
CREATE INDEX reportes_estado_idx ON reportes (estado);
CREATE INDEX reportes_ciudadano_idx ON reportes (ciudadano_id);

-- Tabla de Historial de Cambios (línea de tiempo pública)
CREATE TABLE validacion_reportes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporte_id      UUID NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
    usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    estado_asignado VARCHAR(50) NOT NULL
                        CHECK (estado_asignado IN ('Pendiente', 'En Proceso', 'Resuelto', 'Rechazado')),
    comentario      TEXT NOT NULL
);

-- Tabla de Comentarios Internos (privados entre Administradores - HU021)
CREATE TABLE comentarios_internos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporte_id      UUID NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
    admin_id        UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    comentario      TEXT NOT NULL,
    fecha_creacion  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tabla de Notificaciones
CREATE TABLE notificaciones (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    reporte_id  UUID REFERENCES reportes(id) ON DELETE SET NULL,
    mensaje     TEXT NOT NULL,
    tipo        VARCHAR(50) NOT NULL CHECK (tipo IN ('Email', 'Push', 'Sistema')),
    leida       BOOLEAN DEFAULT FALSE NOT NULL,
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
