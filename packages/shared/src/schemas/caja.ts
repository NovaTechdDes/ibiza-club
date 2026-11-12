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

// Editar: barra admite null para quitarle la ubicación a la caja.
export const CajaUpdateSchema = z.object({
    nombre: CajaInputSchema.shape.nombre.optional(),
    barra: CajaInputSchema.shape.barra
});
export type CajaUpdate = z.infer<typeof CajaUpdateSchema>;