import z from "zod";
import { LARGO_NOMBRE_CORTO } from "../constantes.js";

export const CajaInputSchema = z.object({
    nombre: z.string().trim().min(1).max(LARGO_NOMBRE_CORTO),
    barra: z.string().trim().min(1).max(LARGO_NOMBRE_CORTO).optional().nullable(),
});

export const CajaSchema = CajaInputSchema.extend({
    id: z.number().int().positive(),
    activo: z.boolean(),
    version: z.number().int().min(0)
});

export type CajaInput = z.infer<typeof CajaInputSchema>
export type Caja = z.infer<typeof CajaSchema>