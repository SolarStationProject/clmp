import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import { globalMiddlewares, errorMiddleware } from './middlewares';
import authRoutes    from './modules/auth/auth.routes';
import reportsRoutes from './modules/reports/reports.routes';
import heatmapRoutes from './modules/heatmap/heatmap.routes';
import adminRoutes   from './modules/admin/admin.routes';
import { db }        from './config/database';

const app  = express();
const PORT = process.env.PORT || 3000;

globalMiddlewares(app);

// Migraciones idempotentes
db.query(`ALTER TABLE reportes ADD COLUMN IF NOT EXISTS eliminado BOOLEAN DEFAULT FALSE`)
    .catch(e => console.warn('[Migration] eliminado:', e.message));
db.query(`ALTER TABLE reportes ADD COLUMN IF NOT EXISTS prioridad VARCHAR(20) DEFAULT 'Normal'`)
    .catch(e => console.warn('[Migration] prioridad:', e.message));

app.get('/', (_req, res) => res.json({ status: 'ok', servicio: 'CleanMap API', version: '1.0.0' }));

app.use('/api/auth',    authRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/heatmap', heatmapRoutes);
app.use('/api/admin',   adminRoutes);

app.use(errorMiddleware);

app.listen(PORT, () => {
    console.log(`[CleanMap] Backend escuchando en http://localhost:${PORT}`);
});

export default app;
