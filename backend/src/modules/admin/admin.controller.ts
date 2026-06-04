import { Request, Response } from 'express';
import { db } from '../../config/database';
import bcrypt from 'bcryptjs';

// Datos del seed para restaurar
const CIUDADANOS = [
    { id: 'c0000000-0000-0000-0000-000000000002', nombre: 'María González',  email: 'maria@ciudadano.cl',  password: 'Ciudadano123!', rol: 'Ciudadano' },
    { id: 'c0000000-0000-0000-0000-000000000003', nombre: 'Carlos Pérez',    email: 'carlos@ciudadano.cl', password: 'Ciudadano123!', rol: 'Ciudadano' },
    { id: 'c0000000-0000-0000-0000-000000000004', nombre: 'Ana Rodríguez',   email: 'ana@ciudadano.cl',    password: 'Ciudadano123!', rol: 'Ciudadano' },
    { id: 'c0000000-0000-0000-0000-000000000005', nombre: 'Luis Martínez',   email: 'luis@ciudadano.cl',   password: 'Ciudadano123!', rol: 'Ciudadano' },
];

const REPORTES_SEED = [
    { id: 'b0000001-0000-0000-0000-000000000001', ci: 1, codigo: 'CLM-2026-001', titulo: 'Basural en Av. Irarrázaval',          descripcion: 'Acumulación de escombros y desechos domiciliarios en la vereda.',   categoria: 'Escombros',               estado: 'Pendiente',   direccion: 'Av. Irarrázaval 1240',           comuna: 'Ñuñoa',            lat: -33.4569, lng: -70.5921 },
    { id: 'b0000002-0000-0000-0000-000000000002', ci: 2, codigo: 'CLM-2026-002', titulo: 'Microbasural en Vicuña Mackenna',     descripcion: 'Bolsas de basura abandonadas bajo el paso a desnivel.',            categoria: 'Residuos domiciliarios',   estado: 'En Proceso',  direccion: 'Av. Vicuña Mackenna 7200',       comuna: 'La Florida',       lat: -33.5180, lng: -70.5785 },
    { id: 'b0000003-0000-0000-0000-000000000003', ci: 3, codigo: 'CLM-2026-003', titulo: 'Escombros en Av. Pajaritos',          descripcion: 'Material de demolición dejado en la vía pública sin permiso.',      categoria: 'Escombros',               estado: 'Resuelto',    direccion: 'Av. Pajaritos 3800',             comuna: 'Maipú',            lat: -33.5092, lng: -70.7680 },
    { id: 'b0000004-0000-0000-0000-000000000004', ci: 4, codigo: 'CLM-2026-004', titulo: 'Vertedero ilegal barrio Yungay',      descripcion: 'Muebles y colchones abandonados en sitio eriazo.',                  categoria: 'Residuos especiales',      estado: 'Rechazado',   direccion: 'Calle Libertad 456',             comuna: 'Santiago',         lat: -33.4435, lng: -70.6754 },
    { id: 'b0000005-0000-0000-0000-000000000005', ci: 1, codigo: 'CLM-2026-005', titulo: 'Residuos en Av. Salvador',            descripcion: 'Bolsas de basura y cartones acumulados por semanas.',              categoria: 'Residuos domiciliarios',   estado: 'Pendiente',   direccion: 'Av. Salvador 1100',              comuna: 'Providencia',      lat: -33.4378, lng: -70.6158 },
    { id: 'b0000006-0000-0000-0000-000000000006', ci: 2, codigo: 'CLM-2026-006', titulo: 'Basural en Gran Avenida',             descripcion: 'Acumulación de residuos peligrosos en la berma.',                  categoria: 'Residuos peligrosos',      estado: 'En Proceso',  direccion: 'Gran Avenida 6300',              comuna: 'San Miguel',       lat: -33.4972, lng: -70.6571 },
    { id: 'b0000007-0000-0000-0000-000000000007', ci: 3, codigo: 'CLM-2026-007', titulo: 'Escombros en Av. Las Rejas',          descripcion: 'Desmonte de construcción bloqueando parcialmente la calzada.',     categoria: 'Escombros',               estado: 'Pendiente',   direccion: 'Av. Las Rejas 2400',             comuna: 'Pudahuel',         lat: -33.4398, lng: -70.7534 },
    { id: 'b0000008-0000-0000-0000-000000000008', ci: 4, codigo: 'CLM-2026-008', titulo: 'Vertedero bajo Vespucio Norte',       descripcion: 'Gran acumulación de desechos bajo el paso a desnivel.',            categoria: 'Residuos especiales',      estado: 'En Proceso',  direccion: 'Américo Vespucio Norte 5200',    comuna: 'Cerro Navia',      lat: -33.4156, lng: -70.7334 },
    { id: 'b0000009-0000-0000-0000-000000000009', ci: 1, codigo: 'CLM-2026-009', titulo: 'Microbasural sitio eriazo La Pintana',descripcion: 'Residuos domésticos y escombros en terreno abandonado.',           categoria: 'Residuos domiciliarios',   estado: 'Pendiente',   direccion: 'Av. La Serena 1800',             comuna: 'La Pintana',       lat: -33.5750, lng: -70.6320 },
    { id: 'b0000010-0000-0000-0000-000000000010', ci: 2, codigo: 'CLM-2026-010', titulo: 'Basura en El Bosque',                 descripcion: 'Depósito clandestino de electrodomésticos y muebles.',             categoria: 'Residuos especiales',      estado: 'Resuelto',    direccion: 'Av. José Joaquín Pérez 3100',    comuna: 'El Bosque',        lat: -33.5547, lng: -70.6643 },
    { id: 'b0000011-0000-0000-0000-000000000011', ci: 3, codigo: 'CLM-2026-011', titulo: 'Residuos en Av. Recoleta',            descripcion: 'Bolsas de basura acumuladas frente a sitio en construcción.',     categoria: 'Residuos domiciliarios',   estado: 'Pendiente',   direccion: 'Av. Recoleta 2800',              comuna: 'Recoleta',         lat: -33.4015, lng: -70.6480 },
    { id: 'b0000012-0000-0000-0000-000000000012', ci: 4, codigo: 'CLM-2026-012', titulo: 'Escombros en Peñalolén',              descripcion: 'Material de demolición en quebrada, riesgo ambiental.',            categoria: 'Escombros',               estado: 'En Proceso',  direccion: 'Av. Tobalaba 12300',             comuna: 'Peñalolén',        lat: -33.4892, lng: -70.5467 },
    { id: 'b0000013-0000-0000-0000-000000000013', ci: 1, codigo: 'CLM-2026-013', titulo: 'Neumáticos abandonados Quilicura',    descripcion: 'Más de 30 neumáticos arrojados en la berma de la carretera.',     categoria: 'Residuos especiales',      estado: 'Resuelto',    direccion: 'Av. Manuel Antonio Matta 1500',  comuna: 'Quilicura',        lat: -33.3587, lng: -70.7456 },
    { id: 'b0000014-0000-0000-0000-000000000014', ci: 2, codigo: 'CLM-2026-014', titulo: 'Vertedero en Lo Espejo',              descripcion: 'Residuos industriales mezclados con basura doméstica.',            categoria: 'Residuos peligrosos',      estado: 'Pendiente',   direccion: 'Gran Avenida 8900',              comuna: 'Lo Espejo',        lat: -33.5189, lng: -70.7001 },
    { id: 'b0000015-0000-0000-0000-000000000015', ci: 3, codigo: 'CLM-2026-015', titulo: 'Basural en San Bernardo',             descripcion: 'Acumulación periódica de desechos en ribera del zanjón.',         categoria: 'Residuos domiciliarios',   estado: 'Rechazado',   direccion: 'Av. Colón 4500',                 comuna: 'San Bernardo',     lat: -33.5910, lng: -70.7031 },
    { id: 'b0000016-0000-0000-0000-000000000016', ci: 4, codigo: 'CLM-2026-016', titulo: 'Escombros Estación Central',          descripcion: 'Desmonte bloqueando el paso peatonal en la Alameda.',             categoria: 'Escombros',               estado: 'En Proceso',  direccion: 'Alameda 3500',                   comuna: 'Estación Central', lat: -33.4543, lng: -70.6812 },
    { id: 'b0000017-0000-0000-0000-000000000017', ci: 1, codigo: 'CLM-2026-017', titulo: 'Microbasural en Conchalí',            descripcion: 'Cartones, plásticos y restos de comida acumulados.',              categoria: 'Residuos domiciliarios',   estado: 'Pendiente',   direccion: 'Av. Independencia 4100',         comuna: 'Conchalí',         lat: -33.3901, lng: -70.6712 },
    { id: 'b0000018-0000-0000-0000-000000000018', ci: 2, codigo: 'CLM-2026-018', titulo: 'Basural en La Granja',                descripcion: 'Residuos mezclados con escombros en pasaje sin salida.',          categoria: 'Residuos domiciliarios',   estado: 'Resuelto',    direccion: 'Av. Santa Rosa 8200',            comuna: 'La Granja',        lat: -33.5312, lng: -70.6289 },
    { id: 'b0000019-0000-0000-0000-000000000019', ci: 3, codigo: 'CLM-2026-019', titulo: 'Aceites industriales San Ramón',      descripcion: 'Tambores con aceite quemado abandonados en calzada.',             categoria: 'Residuos peligrosos',      estado: 'Pendiente',   direccion: 'Av. La Serena 3400',             comuna: 'San Ramón',        lat: -33.5389, lng: -70.6412 },
    { id: 'b0000020-0000-0000-0000-000000000020', ci: 4, codigo: 'CLM-2026-020', titulo: 'Vertedero en Lo Prado',               descripcion: 'Sitio eriazo usado como basural clandestino recurrente.',         categoria: 'Escombros',               estado: 'En Proceso',  direccion: 'Av. Pudahuel 5600',              comuna: 'Lo Prado',         lat: -33.4578, lng: -70.7256 },
];

const ADMIN_ID = 'a0000000-0000-0000-0000-000000000001';

// POST /api/admin/reset-db
export async function resetDatabase(_req: Request, res: Response): Promise<void> {
    const client = await db.connect();
    try {
        // Eliminar todo excepto el admin
        await client.query(`
            TRUNCATE TABLE comentarios_internos, validacion_reportes, notificaciones,
                           tokens_verificacion, intentos_login, reportes RESTART IDENTITY CASCADE
        `);
        await client.query(`DELETE FROM usuarios WHERE email != 'admin@cleanmapp.cl'`);

        // Recrear ciudadanos con hashes frescos
        for (const u of CIUDADANOS) {
            const hash = await bcrypt.hash(u.password, 10);
            await client.query(
                `INSERT INTO usuarios (id, nombre, email, password, rol, verificado)
                 VALUES ($1, $2, $3, $4, $5, true)
                 ON CONFLICT (email) DO NOTHING`,
                [u.id, u.nombre, u.email, hash, u.rol]
            );
        }

        // Reinsertar 20 reportes del seed
        for (const r of REPORTES_SEED) {
            const ciudadano_id = CIUDADANOS[r.ci - 1].id;
            await client.query(
                `INSERT INTO reportes
                    (id, ciudadano_id, codigo, titulo, descripcion, categoria, estado, direccion, comuna, geom)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, ST_SetSRID(ST_MakePoint($11,$10),4326))
                 ON CONFLICT (id) DO NOTHING`,
                [r.id, ciudadano_id, r.codigo, r.titulo, r.descripcion,
                 r.categoria, r.estado, r.direccion, r.comuna, r.lat, r.lng]
            );
        }

        // Historial básico
        const historial = [
            { rid: 'b0000002-0000-0000-0000-000000000002', e: 'En Proceso', c: 'Asignado a equipo de limpieza zona sur.' },
            { rid: 'b0000003-0000-0000-0000-000000000003', e: 'Resuelto',   c: 'Sector limpiado completamente.' },
            { rid: 'b0000004-0000-0000-0000-000000000004', e: 'Rechazado',  c: 'Obra con permiso municipal vigente.' },
            { rid: 'b0000010-0000-0000-0000-000000000010', e: 'Resuelto',   c: 'Electrodomésticos retirados y llevados a punto limpio.' },
            { rid: 'b0000013-0000-0000-0000-000000000013', e: 'Resuelto',   c: 'Neumáticos retirados por empresa autorizada.' },
        ];
        for (const h of historial) {
            await client.query(
                `INSERT INTO validacion_reportes (reporte_id, usuario_id, estado_asignado, comentario)
                 VALUES ($1, $2, $3, $4)`,
                [h.rid, ADMIN_ID, h.e, h.c]
            );
        }

        res.status(200).json({ mensaje: 'Base de datos reseteada exitosamente' });
    } catch (err: any) {
        console.error('[Admin] Error en reset:', err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
}
