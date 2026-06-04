// Seed real — genera hashes bcrypt y carga datos en la BD
// Uso: npm run db:seed
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool(
    process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
        : {
              host: process.env.DB_HOST || 'localhost',
              port: parseInt(process.env.DB_PORT || '5432'),
              database: process.env.DB_NAME || 'cleanmap',
              user: process.env.DB_USER || 'postgres',
              password: process.env.DB_PASSWORD || '',
          }
);

// ── Usuarios ──────────────────────────────────────────────────────────────────
const USUARIOS = [
    {
        id:       'a0000000-0000-0000-0000-000000000001',
        nombre:   'Administrador CleanMap',
        email:    'admin@cleanmapp.cl',
        password: 'Admin1234!',
        rol:      'Administrador',
        verificado: true,
    },
    {
        id:       'c0000000-0000-0000-0000-000000000002',
        nombre:   'María González',
        email:    'maria@ciudadano.cl',
        password: 'Ciudadano123!',
        rol:      'Ciudadano',
        verificado: true,
    },
    {
        id:       'c0000000-0000-0000-0000-000000000003',
        nombre:   'Carlos Pérez',
        email:    'carlos@ciudadano.cl',
        password: 'Ciudadano123!',
        rol:      'Ciudadano',
        verificado: true,
    },
    {
        id:       'c0000000-0000-0000-0000-000000000004',
        nombre:   'Ana Rodríguez',
        email:    'ana@ciudadano.cl',
        password: 'Ciudadano123!',
        rol:      'Ciudadano',
        verificado: true,
    },
    {
        id:       'c0000000-0000-0000-0000-000000000005',
        nombre:   'Luis Martínez',
        email:    'luis@ciudadano.cl',
        password: 'Ciudadano123!',
        rol:      'Ciudadano',
        verificado: true,
    },
];

// ── 20 Reportes con coordenadas reales de Santiago ───────────────────────────
const REPORTES = [
    { id: 'b0000001-0000-0000-0000-000000000001', ciudadano_idx: 1, codigo: 'CLM-2026-001', titulo: 'Basural en Av. Irarrázaval', descripcion: 'Acumulación de escombros y desechos domiciliarios en la vereda.', categoria: 'Escombros', estado: 'Pendiente',  direccion: 'Av. Irarrázaval 1240', comuna: 'Ñuñoa',           lat: -33.4569, lng: -70.5921 },
    { id: 'b0000002-0000-0000-0000-000000000002', ciudadano_idx: 2, codigo: 'CLM-2026-002', titulo: 'Microbasural en Vicuña Mackenna', descripcion: 'Bolsas de basura abandonadas bajo el paso a desnivel.', categoria: 'Residuos domiciliarios', estado: 'En Proceso',  direccion: 'Av. Vicuña Mackenna 7200', comuna: 'La Florida',      lat: -33.5180, lng: -70.5785 },
    { id: 'b0000003-0000-0000-0000-000000000003', ciudadano_idx: 3, codigo: 'CLM-2026-003', titulo: 'Escombros en Av. Pajaritos', descripcion: 'Material de demolición dejado en la vía pública sin permiso.', categoria: 'Escombros', estado: 'Resuelto',   direccion: 'Av. Pajaritos 3800', comuna: 'Maipú',            lat: -33.5092, lng: -70.7680 },
    { id: 'b0000004-0000-0000-0000-000000000004', ciudadano_idx: 4, codigo: 'CLM-2026-004', titulo: 'Vertedero ilegal barrio Yungay', descripcion: 'Muebles y colchones abandonados en sitio eriazo del barrio histórico.', categoria: 'Residuos especiales', estado: 'Rechazado',  direccion: 'Calle Libertad 456', comuna: 'Santiago',         lat: -33.4435, lng: -70.6754 },
    { id: 'b0000005-0000-0000-0000-000000000005', ciudadano_idx: 1, codigo: 'CLM-2026-005', titulo: 'Residuos en Av. Salvador', descripcion: 'Bolsas de basura y cartones acumulados por semanas.', categoria: 'Residuos domiciliarios', estado: 'Pendiente',  direccion: 'Av. Salvador 1100', comuna: 'Providencia',      lat: -33.4378, lng: -70.6158 },
    { id: 'b0000006-0000-0000-0000-000000000006', ciudadano_idx: 2, codigo: 'CLM-2026-006', titulo: 'Basural en Gran Avenida', descripcion: 'Acumulación de residuos peligrosos en la berma.', categoria: 'Residuos peligrosos', estado: 'En Proceso',  direccion: 'Gran Avenida 6300', comuna: 'San Miguel',       lat: -33.4972, lng: -70.6571 },
    { id: 'b0000007-0000-0000-0000-000000000007', ciudadano_idx: 3, codigo: 'CLM-2026-007', titulo: 'Escombros en Av. Las Rejas', descripcion: 'Desmonte de construcción bloqueando parcialmente la calzada.', categoria: 'Escombros', estado: 'Pendiente',  direccion: 'Av. Las Rejas 2400', comuna: 'Pudahuel',         lat: -33.4398, lng: -70.7534 },
    { id: 'b0000008-0000-0000-0000-000000000008', ciudadano_idx: 4, codigo: 'CLM-2026-008', titulo: 'Vertedero bajo Vespucio Norte', descripcion: 'Gran acumulación de desechos bajo el paso a desnivel, zona de riesgo.', categoria: 'Residuos especiales', estado: 'En Proceso',  direccion: 'Américo Vespucio Norte 5200', comuna: 'Cerro Navia',     lat: -33.4156, lng: -70.7334 },
    { id: 'b0000009-0000-0000-0000-000000000009', ciudadano_idx: 1, codigo: 'CLM-2026-009', titulo: 'Microbasural sitio eriazo La Pintana', descripcion: 'Residuos domésticos y escombros en terreno abandonado.', categoria: 'Residuos domiciliarios', estado: 'Pendiente',  direccion: 'Av. La Serena 1800', comuna: 'La Pintana',       lat: -33.5750, lng: -70.6320 },
    { id: 'b0000010-0000-0000-0000-000000000010', ciudadano_idx: 2, codigo: 'CLM-2026-010', titulo: 'Basura en El Bosque', descripcion: 'Depósito clandestino de electrodomésticos y muebles.', categoria: 'Residuos especiales', estado: 'Resuelto',   direccion: 'Av. José Joaquín Pérez 3100', comuna: 'El Bosque',        lat: -33.5547, lng: -70.6643 },
    { id: 'b0000011-0000-0000-0000-000000000011', ciudadano_idx: 3, codigo: 'CLM-2026-011', titulo: 'Residuos en Av. Recoleta', descripcion: 'Bolsas de basura acumuladas frente a sitio en construcción.', categoria: 'Residuos domiciliarios', estado: 'Pendiente',  direccion: 'Av. Recoleta 2800', comuna: 'Recoleta',         lat: -33.4015, lng: -70.6480 },
    { id: 'b0000012-0000-0000-0000-000000000012', ciudadano_idx: 4, codigo: 'CLM-2026-012', titulo: 'Escombros en Peñalolén', descripcion: 'Material de demolición en quebrada, riesgo ambiental.', categoria: 'Escombros', estado: 'En Proceso',  direccion: 'Av. Tobalaba 12300', comuna: 'Peñalolén',       lat: -33.4892, lng: -70.5467 },
    { id: 'b0000013-0000-0000-0000-000000000013', ciudadano_idx: 1, codigo: 'CLM-2026-013', titulo: 'Neumáticos abandonados Quilicura', descripcion: 'Más de 30 neumáticos arrojados en la berma de la carretera.', categoria: 'Residuos especiales', estado: 'Resuelto',   direccion: 'Av. Manuel Antonio Matta 1500', comuna: 'Quilicura',       lat: -33.3587, lng: -70.7456 },
    { id: 'b0000014-0000-0000-0000-000000000014', ciudadano_idx: 2, codigo: 'CLM-2026-014', titulo: 'Vertedero en Lo Espejo', descripcion: 'Residuos industriales mezclados con basura doméstica.', categoria: 'Residuos peligrosos', estado: 'Pendiente',  direccion: 'Gran Avenida 8900', comuna: 'Lo Espejo',        lat: -33.5189, lng: -70.7001 },
    { id: 'b0000015-0000-0000-0000-000000000015', ciudadano_idx: 3, codigo: 'CLM-2026-015', titulo: 'Basural en San Bernardo', descripcion: 'Acumulación periódica de desechos en ribera del zanjón.', categoria: 'Residuos domiciliarios', estado: 'Rechazado',  direccion: 'Av. Colón 4500', comuna: 'San Bernardo',     lat: -33.5910, lng: -70.7031 },
    { id: 'b0000016-0000-0000-0000-000000000016', ciudadano_idx: 4, codigo: 'CLM-2026-016', titulo: 'Escombros Estación Central', descripcion: 'Desmonte bloqueando el paso peatonal en la Alameda.', categoria: 'Escombros', estado: 'En Proceso',  direccion: 'Alameda 3500', comuna: 'Estación Central', lat: -33.4543, lng: -70.6812 },
    { id: 'b0000017-0000-0000-0000-000000000017', ciudadano_idx: 1, codigo: 'CLM-2026-017', titulo: 'Microbasural en Conchalí', descripcion: 'Cartones, plásticos y restos de comida acumulados.', categoria: 'Residuos domiciliarios', estado: 'Pendiente',  direccion: 'Av. Independencia 4100', comuna: 'Conchalí',         lat: -33.3901, lng: -70.6712 },
    { id: 'b0000018-0000-0000-0000-000000000018', ciudadano_idx: 2, codigo: 'CLM-2026-018', titulo: 'Basural en La Granja', descripcion: 'Residuos mezclados con escombros en pasaje sin salida.', categoria: 'Residuos domiciliarios', estado: 'Resuelto',   direccion: 'Av. Santa Rosa 8200', comuna: 'La Granja',        lat: -33.5312, lng: -70.6289 },
    { id: 'b0000019-0000-0000-0000-000000000019', ciudadano_idx: 3, codigo: 'CLM-2026-019', titulo: 'Aceites industriales San Ramón', descripcion: 'Tambores con aceite quemado abandonados en calzada.', categoria: 'Residuos peligrosos', estado: 'Pendiente',  direccion: 'Av. La Serena 3400', comuna: 'San Ramón',        lat: -33.5389, lng: -70.6412 },
    { id: 'b0000020-0000-0000-0000-000000000020', ciudadano_idx: 4, codigo: 'CLM-2026-020', titulo: 'Vertedero en Lo Prado', descripcion: 'Sitio eriazo usado como basural clandestino recurrente.', categoria: 'Escombros', estado: 'En Proceso',  direccion: 'Av. Pudahuel 5600', comuna: 'Lo Prado',         lat: -33.4578, lng: -70.7256 },
];

// ── Historial de algunos reportes ─────────────────────────────────────────────
const HISTORIAL = [
    { reporte_id: 'b0000002-0000-0000-0000-000000000002', estado_asignado: 'En Proceso', comentario: 'Asignado a equipo de limpieza zona sur. Retiro programado para el jueves.' },
    { reporte_id: 'b0000003-0000-0000-0000-000000000003', estado_asignado: 'En Proceso', comentario: 'Coordinado retiro con empresa contratista municipal.' },
    { reporte_id: 'b0000003-0000-0000-0000-000000000003', estado_asignado: 'Resuelto',   comentario: 'Sector limpiado completamente. Señalética preventiva instalada.' },
    { reporte_id: 'b0000004-0000-0000-0000-000000000004', estado_asignado: 'Rechazado',  comentario: 'El material reportado corresponde a obras con permiso municipal vigente N°2024-381.' },
    { reporte_id: 'b0000006-0000-0000-0000-000000000006', estado_asignado: 'En Proceso', comentario: 'Notificada SEREMI de Salud para manejo de residuos peligrosos. Área señalizada.' },
    { reporte_id: 'b0000008-0000-0000-0000-000000000008', estado_asignado: 'En Proceso', comentario: 'Coordinando retiro con empresa especializada en residuos especiales.' },
    { reporte_id: 'b0000010-0000-0000-0000-000000000010', estado_asignado: 'Resuelto',   comentario: 'Electrodomésticos retirados y llevados a punto limpio autorizado.' },
    { reporte_id: 'b0000013-0000-0000-0000-000000000013', estado_asignado: 'Resuelto',   comentario: 'Neumáticos retirados por empresa autorizada.' },
    { reporte_id: 'b0000015-0000-0000-0000-000000000015', estado_asignado: 'Rechazado',  comentario: 'Zona de manejo municipal, no aplica reporte ciudadano.' },
    { reporte_id: 'b0000016-0000-0000-0000-000000000016', estado_asignado: 'En Proceso', comentario: 'Empresa constructora notificada. Plazo de retiro: 48 horas.' },
    { reporte_id: 'b0000018-0000-0000-0000-000000000018', estado_asignado: 'Resuelto',   comentario: 'Pasaje limpiado. Se instaló señalética de prohibición.' },
    { reporte_id: 'b0000012-0000-0000-0000-000000000012', estado_asignado: 'En Proceso', comentario: 'Coordinando con municipio de Peñalolén para acceso a la quebrada.' },
];

async function run() {
    const client = await pool.connect();
    try {
        console.log('🌱 Iniciando seed...\n');

        // ── Limpiar datos anteriores (mantiene estructura) ──
        console.log('🧹 Limpiando datos anteriores...');
        await client.query('TRUNCATE TABLE comentarios_internos, validacion_reportes, notificaciones, tokens_verificacion, intentos_login, reportes, usuarios RESTART IDENTITY CASCADE');

        // ── Usuarios con hashes bcrypt reales ──
        console.log('👤 Creando usuarios...');
        for (const u of USUARIOS) {
            const hash = await bcrypt.hash(u.password, 10);
            await client.query(
                `INSERT INTO usuarios (id, nombre, email, password, rol, verificado)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [u.id, u.nombre, u.email, hash, u.rol, u.verificado]
            );
            console.log(`   ✓ ${u.email} (${u.rol})`);
        }

        // ── Reportes ──
        console.log('\n📍 Creando 20 reportes...');
        for (const r of REPORTES) {
            const ciudadano_id = USUARIOS[r.ciudadano_idx].id;
            await client.query(
                `INSERT INTO reportes
                    (id, ciudadano_id, codigo, titulo, descripcion, categoria, estado, direccion, comuna, geom)
                 VALUES
                    ($1, $2, $3, $4, $5, $6, $7, $8, $9,
                     ST_SetSRID(ST_MakePoint($11, $10), 4326))`,
                [r.id, ciudadano_id, r.codigo, r.titulo, r.descripcion,
                 r.categoria, r.estado, r.direccion, r.comuna, r.lat, r.lng]
            );
            console.log(`   ✓ ${r.codigo} — ${r.comuna} [${r.estado}]`);
        }

        // ── Historial de cambios ──
        console.log('\n📋 Creando historial...');
        const adminId = USUARIOS[0].id;
        for (const h of HISTORIAL) {
            await client.query(
                `INSERT INTO validacion_reportes (reporte_id, usuario_id, estado_asignado, comentario)
                 VALUES ($1, $2, $3, $4)`,
                [h.reporte_id, adminId, h.estado_asignado, h.comentario]
            );
        }
        console.log(`   ✓ ${HISTORIAL.length} entradas de historial`);

        // ── Comentarios internos ──
        console.log('\n🔒 Creando comentarios internos...');
        await client.query(
            `INSERT INTO comentarios_internos (reporte_id, admin_id, comentario) VALUES
             ($1, $2, 'Zona reincidente. Evaluar cámara disuasoria.')`,
            ['b0000001-0000-0000-0000-000000000001', adminId]
        );
        await client.query(
            `INSERT INTO comentarios_internos (reporte_id, admin_id, comentario) VALUES
             ($1, $2, 'Posible empresa infractora identificada. Coordinando con fiscalización.')`,
            ['b0000006-0000-0000-0000-000000000006', adminId]
        );

        console.log('\n✅ Seed completado exitosamente');
        console.log('\n📌 Credenciales de acceso:');
        console.log('   👔 Admin:    admin@cleanmapp.cl  /  Admin1234!  (plataforma: web)');
        console.log('   👤 María:    maria@ciudadano.cl  /  Ciudadano123!  (plataforma: movil)');
        console.log('   👤 Carlos:   carlos@ciudadano.cl /  Ciudadano123!  (plataforma: movil)');
        console.log('   👤 Ana:      ana@ciudadano.cl    /  Ciudadano123!  (plataforma: movil)');
        console.log('   👤 Luis:     luis@ciudadano.cl   /  Ciudadano123!  (plataforma: movil)');

    } catch (err: any) {
        console.error('\n❌ Error en seed:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
