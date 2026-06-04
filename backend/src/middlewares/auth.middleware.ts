import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../shared/types';

const secret = () => process.env.JWT_SECRET || 'dev_secret_change_in_production';

export const verificarToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token no proporcionado.' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        req.usuario = jwt.verify(token, secret()) as JwtPayload;
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

export const soloAdministrador = (req: Request, res: Response, next: NextFunction): void => {
    verificarToken(req, res, () => {
        if (req.usuario?.rol !== 'Administrador') {
            res.status(403).json({ error: 'Acceso denegado. Se requiere rol Administrador.' });
            return;
        }
        next();
    });
};

export const soloCiudadano = (req: Request, res: Response, next: NextFunction): void => {
    verificarToken(req, res, () => {
        if (req.usuario?.rol !== 'Ciudadano') {
            res.status(403).json({ error: 'Acceso denegado. Se requiere rol Ciudadano.' });
            return;
        }
        next();
    });
};
