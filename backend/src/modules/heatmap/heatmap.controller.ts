import { Request, Response } from 'express';
import {
    obtenerPuntosCalor,
    obtenerZonasCriticas,
    obtenerDatosExportacion,
    FiltrosHeatMap,
} from './heatmap.service';

const ESTADOS_VALIDOS = ['Pendiente', 'En Proceso', 'Resuelto', 'Rechazado'];
const esFechaValida = (s: string) => !isNaN(new Date(s).getTime());

// GET /api/heatmap
export const obtenerMapaCalor = async (req: Request, res: Response): Promise<void> => {
    const { estado, fecha_desde, fecha_hasta } = req.query;
    if (estado && !ESTADOS_VALIDOS.includes(estado as string)) {
        res.status(400).json({ error: `Estado inválido. Aceptados: ${ESTADOS_VALIDOS.join(', ')}` });
        return;
    }
    if (fecha_desde && !esFechaValida(fecha_desde as string)) {
        res.status(400).json({ error: 'fecha_desde no es válida.' });
        return;
    }
    if (fecha_hasta && !esFechaValida(fecha_hasta as string)) {
        res.status(400).json({ error: 'fecha_hasta no es válida.' });
        return;
    }
    try {
        const filtros: FiltrosHeatMap = {
            estado:      estado      ? String(estado)      : undefined,
            fecha_desde: fecha_desde ? String(fecha_desde) : undefined,
            fecha_hasta: fecha_hasta ? String(fecha_hasta) : undefined,
        };
        const [puntos, zonas] = await Promise.all([obtenerPuntosCalor(filtros), obtenerZonasCriticas()]);
        res.status(200).json({
            puntos_calor:   puntos,
            zonas_criticas: zonas,
            total_puntos:   puntos.length,
            generado_en:    new Date().toISOString(),
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/heatmap/exportar
export const exportarCSV = async (req: Request, res: Response): Promise<void> => {
    const { estado, fecha_desde, fecha_hasta } = req.query;
    try {
        const filas = await obtenerDatosExportacion({
            estado:      estado      ? String(estado)      : undefined,
            fecha_desde: fecha_desde ? String(fecha_desde) : undefined,
            fecha_hasta: fecha_hasta ? String(fecha_hasta) : undefined,
        });
        if (!filas.length) {
            res.status(404).json({ error: 'No hay datos con los filtros aplicados.' });
            return;
        }
        const encabezados = Object.keys(filas[0]).join(',');
        const lineas = filas.map(f =>
            Object.values(f).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
        );
        const csv = [encabezados, ...lineas].join('\n');
        const fecha = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="cleanmap_calor_${fecha}.csv"`);
        res.status(200).send('﻿' + csv);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
