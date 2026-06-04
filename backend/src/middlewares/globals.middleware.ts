import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';

export const globalMiddlewares = (app: Application): void => {
    app.use(helmet({
        crossOriginOpenerPolicy:    { policy: 'unsafe-none' },
        crossOriginResourcePolicy:  { policy: 'cross-origin' },
        crossOriginEmbedderPolicy:  false,
    }));

    const origenes = (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim());
    app.use(cors({
        origin:         origenes.length === 1 && origenes[0] === '*' ? '*' : origenes,
        methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Servir imágenes subidas como archivos estáticos
    app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'uploads')));
};
