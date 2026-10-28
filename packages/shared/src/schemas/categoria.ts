import {z} from "zod";
import { LARGO_NOMBRE } from "../constantes.js";

export const CategoriaInputSchema = z.object({
    nombre: z.string().trim().min(1).max(LARGO_NOMBRE),
    orden: z.number().int().min(0).default(0)
});


export const CategoriaSchema = CategoriaInputSchema.extend({
    id: z.number().int().positive(),
    activo: z.boolean(),
    version: z.number().int().min(0)
});

export type CategoriaInput = z.infer<typeof CategoriaInputSchema>
export type Categoria = z.infer<typeof CategoriaSchema>