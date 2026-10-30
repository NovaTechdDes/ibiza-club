import { Router } from "express";
import { RangoReporteQuerySchema, type RangoReporte } from "@ibiza/shared";
import { validar } from "../../middleware/validar.js";
import { ventasPorMedioPago } from "./reporte.service.js";

export const reporteRouter: Router = Router();

// validar ya reemplazó req.query por el rango parseado (con "hasta" completado)
reporteRouter.get('/ventas/medio-pago', validar({ query: RangoReporteQuerySchema }), async (req, res) => {
    res.json(await ventasPorMedioPago(req.query as RangoReporte))
});
