import { Router } from "express";
import { RangoReporteQuerySchema, type RangoReporte } from "@ibiza/shared";
import { validar } from "../../middleware/validar.js";
import { arqueo, estadoSincronizacion, ventasPorCaja, ventasPorMedioPago, ventasPorPromo } from "./reporte.service.js";

export const reporteRouter: Router = Router();

// validar ya reemplazó req.query por el rango parseado (con "hasta" completado)
reporteRouter.get('/ventas/medio-pago', validar({query: RangoReporteQuerySchema }), async (req, res) => {
    res.json(await ventasPorMedioPago(req.query as RangoReporte))
});

reporteRouter.get('/ventas/caja', validar({query: RangoReporteQuerySchema}), async (req, res) => {
    res.json(await ventasPorCaja(req.query as RangoReporte))
});

reporteRouter.get('/ventas/promo', validar({ query: RangoReporteQuerySchema}), async (req, res) => {
    res.json(await ventasPorPromo(req.query as RangoReporte))
});

reporteRouter.get('/arqueo', validar({ query: RangoReporteQuerySchema}), async (req, res) => {
    res.json(await arqueo(req.query as RangoReporte))
});

// Sin validar: es el estado actual, no recibe rango de fechas
reporteRouter.get('/sync', async (_req, res) => {
    res.json(await estadoSincronizacion());
});