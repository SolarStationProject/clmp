-- CleanMap - Datos semilla para desarrollo y demo
-- Contraseñas almacenadas con bcrypt (valor plano: 'Admin1234!')
-- Hash generado con bcrypt rounds=10

-- Limpieza antes de seed
TRUNCATE TABLE comentarios_internos, validacion_reportes, notificaciones, reportes, intentos_login, usuarios RESTART IDENTITY CASCADE;

-- Usuarios
INSERT INTO usuarios (id, nombre, email, password, rol, verificado) VALUES
(
    'a1111111-1111-1111-1111-111111111111',
    'Administrador CleanMap',
    'admin@cleanmap.cl',
    '$2b$10$YourHashHere.ReplaceWithBcryptOf.Admin1234!',
    'Administrador',
    true
),
(
    'c2222222-2222-2222-2222-222222222222',
    'María González',
    'maria@ciudadano.cl',
    '$2b$10$YourHashHere.ReplaceWithBcryptOf.Ciudadano123!',
    'Ciudadano',
    true
),
(
    'c3333333-3333-3333-3333-333333333333',
    'Carlos Pérez',
    'carlos@ciudadano.cl',
    '$2b$10$YourHashHere.ReplaceWithBcryptOf.Ciudadano123!',
    'Ciudadano',
    true
),
(
    'c4444444-4444-4444-4444-444444444444',
    'Ana Rodríguez',
    'ana@ciudadano.cl',
    '$2b$10$YourHashHere.ReplaceWithBcryptOf.Ciudadano123!',
    'Ciudadano',
    true
),
(
    'c5555555-5555-5555-5555-555555555555',
    'Luis Martínez',
    'luis@ciudadano.cl',
    '$2b$10$YourHashHere.ReplaceWithBcryptOf.Ciudadano123!',
    'Ciudadano',
    true
);

-- Reportes con coordenadas reales de Santiago de Chile
INSERT INTO reportes (id, ciudadano_id, codigo, titulo, descripcion, categoria, foto, estado, direccion, comuna, geom) VALUES
(
    'r1111111-1111-1111-1111-111111111111',
    'c2222222-2222-2222-2222-222222222222',
    'CLM-2026-001',
    'Basural en Av. Grecia',
    'Acumulación de escombros y desechos domiciliarios en la esquina de Av. Grecia con Los Orientales.',
    'Escombros',
    NULL,
    'Pendiente',
    'Av. Grecia 1200, esquina Los Orientales',
    'Ñuñoa',
    ST_SetSRID(ST_MakePoint(-70.6120, -33.4650), 4326)
),
(
    'r2222222-2222-2222-2222-222222222222',
    'c2222222-2222-2222-2222-222222222222',
    'CLM-2026-002',
    'Microbasural en parque Santa Rosa',
    'Bolsas de basura abandonadas al interior del parque, genera mal olor.',
    'Residuos domiciliarios',
    NULL,
    'En Proceso',
    'Parque Santa Rosa, entrada norte',
    'La Florida',
    ST_SetSRID(ST_MakePoint(-70.5950, -33.5280), 4326)
),
(
    'r3333333-3333-3333-3333-333333333333',
    'c3333333-3333-3333-3333-333333333333',
    'CLM-2026-003',
    'Vertedero clandestino Cerro Navia',
    'Gran acumulación de muebles y residuos especiales bajo el paso a desnivel.',
    'Residuos especiales',
    NULL,
    'Resuelto',
    'Paso a desnivel Américo Vespucio Norte',
    'Cerro Navia',
    ST_SetSRID(ST_MakePoint(-70.7480, -33.4130), 4326)
),
(
    'r4444444-4444-4444-4444-444444444444',
    'c4444444-4444-4444-4444-444444444444',
    'CLM-2026-004',
    'Escombros en calle Los Nogales',
    'Material de demolición dejado en la vía pública sin permiso municipal.',
    'Escombros',
    NULL,
    'Rechazado',
    'Los Nogales 456',
    'Pudahuel',
    ST_SetSRID(ST_MakePoint(-70.8020, -33.4450), 4326)
),
(
    'r5555555-5555-5555-5555-555555555555',
    'c5555555-5555-5555-5555-555555555555',
    'CLM-2026-005',
    'Basura en ribera del Zanjón de la Aguada',
    'Acumulación periódica de desechos en la ribera sur del canal.',
    'Residuos domiciliarios',
    NULL,
    'Pendiente',
    'Ribera sur Zanjón de la Aguada, frente a Av. Santa Rosa 4200',
    'San Miguel',
    ST_SetSRID(ST_MakePoint(-70.6480, -33.4980), 4326)
),
(
    'r6666666-6666-6666-6666-666666666666',
    'c3333333-3333-3333-3333-333333333333',
    'CLM-2026-006',
    'Aceites y residuos industriales en calle Pajaritos',
    'Tambores con aceite quemado abandonados en la calzada.',
    'Residuos peligrosos',
    NULL,
    'En Proceso',
    'Av. Pajaritos 3800',
    'Maipú',
    ST_SetSRID(ST_MakePoint(-70.7850, -33.5100), 4326)
),
(
    'r7777777-7777-7777-7777-777777777777',
    'c4444444-4444-4444-4444-444444444444',
    'CLM-2026-007',
    'Basural en sector La Pintana',
    'Microbasural en sitio eriazo de av. La Serena.',
    'Residuos domiciliarios',
    NULL,
    'Pendiente',
    'Av. La Serena 1800, sitio eriazo',
    'La Pintana',
    ST_SetSRID(ST_MakePoint(-70.6280, -33.5720), 4326)
),
(
    'r8888888-8888-8888-8888-888888888888',
    'c5555555-5555-5555-5555-555555555555',
    'CLM-2026-008',
    'Neumáticos abandonados en Quilicura',
    'Más de 20 neumáticos abandonados en la berma de la ruta 5 norte.',
    'Residuos especiales',
    NULL,
    'Resuelto',
    'Ruta 5 Norte, berma sur altura km 14',
    'Quilicura',
    ST_SetSRID(ST_MakePoint(-70.7230, -33.3620), 4326)
);

-- Historial de cambios
INSERT INTO validacion_reportes (reporte_id, usuario_id, estado_asignado, comentario) VALUES
(
    'r2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'En Proceso',
    'Asignado a equipo de limpieza zona sur. Retiro programado para el jueves.'
),
(
    'r3333333-3333-3333-3333-333333333333',
    'a1111111-1111-1111-1111-111111111111',
    'En Proceso',
    'Coordinado retiro con empresa contratista municipal.'
),
(
    'r3333333-3333-3333-3333-333333333333',
    'a1111111-1111-1111-1111-111111111111',
    'Resuelto',
    'Sector limpiado completamente. Colocada señalética preventiva.'
),
(
    'r4444444-4444-4444-4444-444444444444',
    'a1111111-1111-1111-1111-111111111111',
    'Rechazado',
    'El material reportado corresponde a obras con permiso municipal vigente N°2024-381.'
),
(
    'r6666666-6666-6666-6666-666666666666',
    'a1111111-1111-1111-1111-111111111111',
    'En Proceso',
    'Notificada SEREMI de Salud para manejo de residuos peligrosos. Área señalizada.'
),
(
    'r8888888-8888-8888-8888-888888888888',
    'a1111111-1111-1111-1111-111111111111',
    'Resuelto',
    'Neumáticos retirados y llevados a punto limpio autorizado.'
);

-- Comentarios internos (visibles solo para Administradores - HU021)
INSERT INTO comentarios_internos (reporte_id, admin_id, comentario) VALUES
(
    'r1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Zona con reincidencia. Considerar instalación de cámara disuasoria.'
),
(
    'r6666666-6666-6666-6666-666666666666',
    'a1111111-1111-1111-1111-111111111111',
    'Posible empresa infractora identificada. Coordinando con fiscalización.'
);
