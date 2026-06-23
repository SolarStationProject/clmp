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

// ── 20 Reportes con coordenadas verificadas dentro de Providencia (polígono oficial MINVU) ──
const REPORTES = [
    { id: 'b0000001-0000-0000-0000-000000000001', ciudadano_idx: 1, codigo: 'CLM-2026-001', titulo: 'Basural en Av. Providencia',         descripcion: 'Acumulación de bolsas de basura y escombros en la vereda junto al paradero.',        categoria: 'Residuos domiciliarios', estado: 'Pendiente',  direccion: 'Av. Providencia 1234',      comuna: 'Providencia', lat: -33.4328, lng: -70.6290 },
    { id: 'b0000002-0000-0000-0000-000000000002', ciudadano_idx: 2, codigo: 'CLM-2026-002', titulo: 'Escombros en Pedro de Valdivia',      descripcion: 'Material de demolición abandonado en la acera bloqueando el paso peatonal.',          categoria: 'Escombros',              estado: 'En Proceso', direccion: 'Av. Pedro de Valdivia 890', comuna: 'Providencia', lat: -33.4380, lng: -70.6178 },
    { id: 'b0000003-0000-0000-0000-000000000003', ciudadano_idx: 3, codigo: 'CLM-2026-003', titulo: 'Residuos peligrosos en Av. Bilbao',  descripcion: 'Envases con sustancias químicas sin identificar depositados en la vía pública.',      categoria: 'Residuos peligrosos',    estado: 'Resuelto',   direccion: 'Av. Bilbao 2340',           comuna: 'Providencia', lat: -33.4413, lng: -70.6085 },
    { id: 'b0000004-0000-0000-0000-000000000004', ciudadano_idx: 4, codigo: 'CLM-2026-004', titulo: 'Microbasural en Andrés Bello',        descripcion: 'Muebles y colchones abandonados en la berma del parque.',                           categoria: 'Residuos especiales',    estado: 'Rechazado',  direccion: 'Av. Andrés Bello 1560',     comuna: 'Providencia', lat: -33.4265, lng: -70.6210 },
    { id: 'b0000005-0000-0000-0000-000000000005', ciudadano_idx: 1, codigo: 'CLM-2026-005', titulo: 'Residuos en Av. Salvador',            descripcion: 'Bolsas de basura y cartones acumulados por semanas frente al edificio.',             categoria: 'Residuos domiciliarios', estado: 'Pendiente',  direccion: 'Av. Salvador 1100',         comuna: 'Providencia', lat: -33.4378, lng: -70.6158 },
    { id: 'b0000006-0000-0000-0000-000000000006', ciudadano_idx: 2, codigo: 'CLM-2026-006', titulo: 'Basural en Ricardo Lyon',             descripcion: 'Desechos domésticos mezclados con escombros en un sitio eriazo.',                   categoria: 'Residuos especiales',    estado: 'En Proceso', direccion: 'Av. Ricardo Lyon 2100',      comuna: 'Providencia', lat: -33.4380, lng: -70.6340 },
    { id: 'b0000007-0000-0000-0000-000000000007', ciudadano_idx: 3, codigo: 'CLM-2026-007', titulo: 'Escombros en Calle Condell',          descripcion: 'Desmonte de obra arrojado en la calzada restringiendo el tráfico.',                 categoria: 'Escombros',              estado: 'Pendiente',  direccion: 'Calle Condell 455',         comuna: 'Providencia', lat: -33.4352, lng: -70.6155 },
    { id: 'b0000008-0000-0000-0000-000000000008', ciudadano_idx: 4, codigo: 'CLM-2026-008', titulo: 'Microbasural en Eliodoro Yáñez',      descripcion: 'Cartones, botellas y residuos orgánicos acumulados en la esquina.',                 categoria: 'Residuos domiciliarios', estado: 'En Proceso', direccion: 'Av. Eliodoro Yáñez 1780',    comuna: 'Providencia', lat: -33.4420, lng: -70.6245 },
    { id: 'b0000009-0000-0000-0000-000000000009', ciudadano_idx: 1, codigo: 'CLM-2026-009', titulo: 'Basura en Dublé Almeyda',             descripcion: 'Residuos domiciliarios arrojados en pasaje lateral sin contenedores.',              categoria: 'Residuos domiciliarios', estado: 'Pendiente',  direccion: 'Calle Dublé Almeyda 3200',  comuna: 'Providencia', lat: -33.4450, lng: -70.6300 },
    { id: 'b0000010-0000-0000-0000-000000000010', ciudadano_idx: 2, codigo: 'CLM-2026-010', titulo: 'Residuos peligrosos Av. Santa María', descripcion: 'Tambores con aceite quemado y baterías de autos abandonados junto al río.',           categoria: 'Residuos peligrosos',    estado: 'Resuelto',   direccion: 'Av. Santa María 2890',      comuna: 'Providencia', lat: -33.4190, lng: -70.6195 },
    { id: 'b0000011-0000-0000-0000-000000000011', ciudadano_idx: 3, codigo: 'CLM-2026-011', titulo: 'Escombros en Antonio Varas',          descripcion: 'Material de demolición bloqueando la acera frente a obra sin permiso.',             categoria: 'Escombros',              estado: 'Pendiente',  direccion: 'Calle Antonio Varas 890',   comuna: 'Providencia', lat: -33.4310, lng: -70.6270 },
    { id: 'b0000012-0000-0000-0000-000000000012', ciudadano_idx: 4, codigo: 'CLM-2026-012', titulo: 'Basural en Manuel Montt',             descripcion: 'Depósito clandestino de electrodomésticos y muebles viejos.',                       categoria: 'Residuos especiales',    estado: 'En Proceso', direccion: 'Av. Manuel Montt 1450',      comuna: 'Providencia', lat: -33.4360, lng: -70.6060 },
    { id: 'b0000013-0000-0000-0000-000000000013', ciudadano_idx: 1, codigo: 'CLM-2026-013', titulo: 'Residuos en Calle Holanda',           descripcion: 'Más de 20 bolsas de basura arrojadas en la vereda del pasaje sin salida.',          categoria: 'Residuos domiciliarios', estado: 'Resuelto',   direccion: 'Calle Holanda 3120',        comuna: 'Providencia', lat: -33.4440, lng: -70.6165 },
    { id: 'b0000014-0000-0000-0000-000000000014', ciudadano_idx: 2, codigo: 'CLM-2026-014', titulo: 'Microbasural Marchant Pereira',       descripcion: 'Residuos industriales mezclados con basura doméstica en terreno abandonado.',       categoria: 'Residuos peligrosos',    estado: 'Pendiente',  direccion: 'Av. Marchant Pereira 1650', comuna: 'Providencia', lat: -33.4350, lng: -70.6220 },
    { id: 'b0000015-0000-0000-0000-000000000015', ciudadano_idx: 3, codigo: 'CLM-2026-015', titulo: 'Escombros en Los Leones',             descripcion: 'Acumulación periódica de desmonte en la berma de la avenida.',                     categoria: 'Escombros',              estado: 'Rechazado',  direccion: 'Av. Los Leones 1200',       comuna: 'Providencia', lat: -33.4290, lng: -70.6315 },
    { id: 'b0000016-0000-0000-0000-000000000016', ciudadano_idx: 4, codigo: 'CLM-2026-016', titulo: 'Basura en Calle Loreto',              descripcion: 'Cartones y plásticos acumulados junto al contenedor desbordado.',                   categoria: 'Residuos domiciliarios', estado: 'En Proceso', direccion: 'Calle Loreto 455',           comuna: 'Providencia', lat: -33.4260, lng: -70.6180 },
    { id: 'b0000017-0000-0000-0000-000000000017', ciudadano_idx: 1, codigo: 'CLM-2026-017', titulo: 'Residuos peligrosos en Av. Ossa',     descripcion: 'Pinturas y solventes en mal estado depositados en la vía pública.',                 categoria: 'Residuos peligrosos',    estado: 'Pendiente',  direccion: 'Av. Ossa 780',              comuna: 'Providencia', lat: -33.4420, lng: -70.6100 },
    { id: 'b0000018-0000-0000-0000-000000000018', ciudadano_idx: 2, codigo: 'CLM-2026-018', titulo: 'Microbasural en Calle Francia',       descripcion: 'Residuos mezclados con escombros en pasaje lateral sin contenedores.',             categoria: 'Residuos domiciliarios', estado: 'Resuelto',   direccion: 'Calle Francia 3400',        comuna: 'Providencia', lat: -33.4480, lng: -70.6250 },
    { id: 'b0000019-0000-0000-0000-000000000019', ciudadano_idx: 3, codigo: 'CLM-2026-019', titulo: 'Escombros en Costanera Norte',        descripcion: 'Material de demolición arrojado en el bandejón central junto al río.',            categoria: 'Escombros',              estado: 'Pendiente',  direccion: 'Av. Costanera Norte 3100',  comuna: 'Providencia', lat: -33.4190, lng: -70.6140 },
    { id: 'b0000020-0000-0000-0000-000000000020', ciudadano_idx: 4, codigo: 'CLM-2026-020', titulo: 'Basura en Parque Balmaceda',          descripcion: 'Residuos especiales arrojados en el parque afectando el área verde.',              categoria: 'Residuos especiales',    estado: 'En Proceso', direccion: 'Parque Balmaceda s/n',       comuna: 'Providencia', lat: -33.4150, lng: -70.6200 },
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
