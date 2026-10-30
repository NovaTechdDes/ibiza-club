import { z } from "zod";
import { MAX_DIAS_REPORTE } from "../constantes.js";

const DIA_MS = 24 * 60 * 60_000;

// Rango de fechas operativas, ambas inclusive. Si no viene "hasta" se pide una sola jornada
export const RangoReporteQuerySchema = z.object({
    desde: z.iso.date(),
    hasta: z.iso.date().optional()
})
    .transform(({ desde, hasta }) => ({ desde, hasta: hasta ?? desde }))
    // Las fechas ISO se comparan bien como texto
    .refine(({ desde, hasta }) => hasta >= desde, {
        message: '"hasta" no puede ser anterior a "desde"',
        path: ['hasta']
    })
    // Date.parse de "YYYY-MM-DD" es UTC, así que no depende de la zona horaria del servidor
    .refine(({ desde, hasta }) => (Date.parse(hasta) - Date.parse(desde)) / DIA_MS < MAX_DIAS_REPORTE, {
        message: `El rango no puede superar ${MAX_DIAS_REPORTE} días`,
        path: ['hasta']
    });

export type RangoReporte = z.infer<typeof RangoReporteQuerySchema>;
