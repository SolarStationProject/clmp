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
    { id: 'b0000001-0000-0000-0000-000000000001', ci: 1, codigo: 'CLM-2026-001', titulo: 'Basural en Av. Providencia',          descripcion: 'Acumulación de bolsas de basura y escombros en la vereda junto al paradero.',         categoria: 'Residuos domiciliarios', estado: 'Pendiente',  direccion: 'Av. Providencia 1234',      comuna: 'Providencia', lat: -33.4328, lng: -70.6290 },
    { id: 'b0000002-0000-0000-0000-000000000002', ci: 2, codigo: 'CLM-2026-002', titulo: 'Escombros en Pedro de Valdivia',       descripcion: 'Material de demolición abandonado en la acera bloqueando el paso peatonal.',           categoria: 'Escombros',              estado: 'En Proceso', direccion: 'Av. Pedro de Valdivia 890', comuna: 'Providencia', lat: -33.4380, lng: -70.6178 },
    { id: 'b0000003-0000-0000-0000-000000000003', ci: 3, codigo: 'CLM-2026-003', titulo: 'Residuos peligrosos en Av. Bilbao',   descripcion: 'Envases con sustancias químicas sin identificar depositados en la vía pública.',       categoria: 'Residuos peligrosos',    estado: 'Resuelto',   direccion: 'Av. Bilbao 2340',           comuna: 'Providencia', lat: -33.4413, lng: -70.6085 },
    { id: 'b0000004-0000-0000-0000-000000000004', ci: 4, codigo: 'CLM-2026-004', titulo: 'Microbasural en Andrés Bello',         descripcion: 'Muebles y colchones abandonados en la berma del parque.',                            categoria: 'Residuos especiales',    estado: 'Rechazado',  direccion: 'Av. Andrés Bello 1560',     comuna: 'Providencia', lat: -33.4265, lng: -70.6210 },
    { id: 'b0000005-0000-0000-0000-000000000005', ci: 1, codigo: 'CLM-2026-005', titulo: 'Residuos en Av. Salvador',             descripcion: 'Bolsas de basura y cartones acumulados por semanas frente al edificio.',              categoria: 'Residuos domiciliarios', estado: 'Pendiente',  direccion: 'Av. Salvador 1100',         comuna: 'Providencia', lat: -33.4378, lng: -70.6158 },
    { id: 'b0000006-0000-0000-0000-000000000006', ci: 2, codigo: 'CLM-2026-006', titulo: 'Basural en Ricardo Lyon',              descripcion: 'Desechos domésticos mezclados con escombros en un sitio eriazo.',                    categoria: 'Residuos especiales',    estado: 'En Proceso', direccion: 'Av. Ricardo Lyon 2100',      comuna: 'Providencia', lat: -33.4380, lng: -70.6340 },
    { id: 'b0000007-0000-0000-0000-000000000007', ci: 3, codigo: 'CLM-2026-007', titulo: 'Escombros en Calle Condell',           descripcion: 'Desmonte de obra arrojado en la calzada restringiendo el tráfico.',                  categoria: 'Escombros',              estado: 'Pendiente',  direccion: 'Calle Condell 455',         comuna: 'Providencia', lat: -33.4352, lng: -70.6155 },
    { id: 'b0000008-0000-0000-0000-000000000008', ci: 4, codigo: 'CLM-2026-008', titulo: 'Microbasural en Eliodoro Yáñez',       descripcion: 'Cartones, botellas y residuos orgánicos acumulados en la esquina.',                  categoria: 'Residuos domiciliarios', estado: 'En Proceso', direccion: 'Av. Eliodoro Yáñez 1780',    comuna: 'Providencia', lat: -33.4420, lng: -70.6245 },
    { id: 'b0000009-0000-0000-0000-000000000009', ci: 1, codigo: 'CLM-2026-009', titulo: 'Basura en Dublé Almeyda',              descripcion: 'Residuos domiciliarios arrojados en pasaje lateral sin contenedores.',               categoria: 'Residuos domiciliarios', estado: 'Pendiente',  direccion: 'Calle Dublé Almeyda 3200',  comuna: 'Providencia', lat: -33.4450, lng: -70.6300 },
    { id: 'b0000010-0000-0000-0000-000000000010', ci: 2, codigo: 'CLM-2026-010', titulo: 'Residuos peligrosos Av. Santa María',  descripcion: 'Tambores con aceite quemado y baterías de autos abandonados junto al río.',            categoria: 'Residuos peligrosos',    estado: 'Resuelto',   direccion: 'Av. Santa María 2890',      comuna: 'Providencia', lat: -33.4190, lng: -70.6195 },
    { id: 'b0000011-0000-0000-0000-000000000011', ci: 3, codigo: 'CLM-2026-011', titulo: 'Escombros en Antonio Varas',           descripcion: 'Material de demolición bloqueando la acera frente a obra sin permiso.',              categoria: 'Escombros',              estado: 'Pendiente',  direccion: 'Calle Antonio Varas 890',   comuna: 'Providencia', lat: -33.4310, lng: -70.6270 },
    { id: 'b0000012-0000-0000-0000-000000000012', ci: 4, codigo: 'CLM-2026-012', titulo: 'Basural en Manuel Montt',              descripcion: 'Depósito clandestino de electrodomésticos y muebles viejos.',                        categoria: 'Residuos especiales',    estado: 'En Proceso', direccion: 'Av. Manuel Montt 1450',      comuna: 'Providencia', lat: -33.4360, lng: -70.6060 },
    { id: 'b0000013-0000-0000-0000-000000000013', ci: 1, codigo: 'CLM-2026-013', titulo: 'Residuos en Calle Holanda',            descripcion: 'Más de 20 bolsas de basura arrojadas en la vereda del pasaje sin salida.',           categoria: 'Residuos domiciliarios', estado: 'Resuelto',   direccion: 'Calle Holanda 3120',        comuna: 'Providencia', lat: -33.4440, lng: -70.6165 },
    { id: 'b0000014-0000-0000-0000-000000000014', ci: 2, codigo: 'CLM-2026-014', titulo: 'Microbasural Marchant Pereira',        descripcion: 'Residuos industriales mezclados con basura doméstica en terreno abandonado.',        categoria: 'Residuos peligrosos',    estado: 'Pendiente',  direccion: 'Av. Marchant Pereira 1650', comuna: 'Providencia', lat: -33.4350, lng: -70.6220 },
    { id: 'b0000015-0000-0000-0000-000000000015', ci: 3, codigo: 'CLM-2026-015', titulo: 'Escombros en Los Leones',              descripcion: 'Acumulación periódica de desmonte en la berma de la avenida.',                      categoria: 'Escombros',              estado: 'Rechazado',  direccion: 'Av. Los Leones 1200',       comuna: 'Providencia', lat: -33.4290, lng: -70.6315 },
    { id: 'b0000016-0000-0000-0000-000000000016', ci: 4, codigo: 'CLM-2026-016', titulo: 'Basura en Calle Loreto',               descripcion: 'Cartones y plásticos acumulados junto al contenedor desbordado.',                    categoria: 'Residuos domiciliarios', estado: 'En Proceso', direccion: 'Calle Loreto 455',           comuna: 'Providencia', lat: -33.4260, lng: -70.6180 },
    { id: 'b0000017-0000-0000-0000-000000000017', ci: 1, codigo: 'CLM-2026-017', titulo: 'Residuos peligrosos en Av. Ossa',      descripcion: 'Pinturas y solventes en mal estado depositados en la vía pública.',                  categoria: 'Residuos peligrosos',    estado: 'Pendiente',  direccion: 'Av. Ossa 780',              comuna: 'Providencia', lat: -33.4420, lng: -70.6100 },
    { id: 'b0000018-0000-0000-0000-000000000018', ci: 2, codigo: 'CLM-2026-018', titulo: 'Microbasural en Calle Francia',        descripcion: 'Residuos mezclados con escombros en pasaje lateral sin contenedores.',              categoria: 'Residuos domiciliarios', estado: 'Resuelto',   direccion: 'Calle Francia 3400',        comuna: 'Providencia', lat: -33.4480, lng: -70.6250 },
    { id: 'b0000019-0000-0000-0000-000000000019', ci: 3, codigo: 'CLM-2026-019', titulo: 'Escombros en Costanera Norte',         descripcion: 'Material de demolición arrojado en el bandejón central junto al río.',             categoria: 'Escombros',              estado: 'Pendiente',  direccion: 'Av. Costanera Norte 3100',  comuna: 'Providencia', lat: -33.4190, lng: -70.6140 },
    { id: 'b0000020-0000-0000-0000-000000000020', ci: 4, codigo: 'CLM-2026-020', titulo: 'Basura en Parque Balmaceda',           descripcion: 'Residuos especiales arrojados en el parque afectando el área verde.',               categoria: 'Residuos especiales',    estado: 'En Proceso', direccion: 'Parque Balmaceda s/n',       comuna: 'Providencia', lat: -33.4150, lng: -70.6200 },
];

const ADMIN_ID = 'a0000000-0000-0000-0000-000000000001';

// POST /api/admin/reset-db
export async function resetDatabase(_req: Request, res: Response): Promise<void> {
    const client = await db.connect();
    try {
        // Asegurar columna eliminado (migración idempotente)
        await client.query(`ALTER TABLE reportes ADD COLUMN IF NOT EXISTS eliminado BOOLEAN DEFAULT FALSE`);

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
