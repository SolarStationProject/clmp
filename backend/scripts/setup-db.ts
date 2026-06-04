// Solo aplica el schema.sql — el seed lo maneja seed-db.ts
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
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

async function run() {
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');

    console.log('🗄️  Conectando a la base de datos...');
    const client = await pool.connect();

    try {
        console.log('📋 Aplicando schema.sql...');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schema);
        console.log('✅ Schema aplicado correctamente');
        console.log('\n🎉 Base de datos lista — corre "npm run db:seed" para cargar los datos');
    } catch (err: any) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
