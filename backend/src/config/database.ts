import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export const db = new Pool(
    process.env.DATABASE_URL
        ? {
              connectionString: process.env.DATABASE_URL,
              ssl: { rejectUnauthorized: false },
              max: 10,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 5000,
          }
        : {
              host:     process.env.DB_HOST     || 'localhost',
              port:     parseInt(process.env.DB_PORT || '5432'),
              database: process.env.DB_NAME     || 'cleanmap',
              user:     process.env.DB_USER     || 'postgres',
              password: process.env.DB_PASSWORD || '',
              max: 10,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 5000,
          }
);

db.on('connect', () => {
    if (process.env.NODE_ENV !== 'test') {
        console.log('[DB] Conexión establecida con PostgreSQL');
    }
});

db.on('error', (err) => {
    console.error('[DB] Error inesperado en el pool:', err.message);
});
