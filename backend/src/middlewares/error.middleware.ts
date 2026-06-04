import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error('[Error]', err.message);
    const status = (err as any).status || 500;
    res.status(status).json({ error: err.message || 'Error interno del servidor.' });
};
