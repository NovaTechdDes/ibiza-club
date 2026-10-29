import {z} from "zod";
import { LARGO_NOMBRE } from "../constantes.js";

export const ProductoInputSchema = z.object({
    nombre: z.string().trim().min(1).max(LARGO_NOMBRE),
    orden: z.number().int().min(0).default(0),
    categoriaId: z.number().int().positive()
});

export const ProductoSchema = ProductoInputSchema.extend({
    id: z.number().int().positive(),
    activo: z.boolean(),
    version: z.number().int().min(0)
});

export type ProductoInput = z.infer<typeof ProductoInputSchema>
export type Producto = z.infer<typeof ProductoSchema>

export const ProductoUpdateSchema = z.object({
    nombre: ProductoInputSchema.shape.nombre.optional(),
    orden: z.number().int().min(0).optional(),
    categoriaId: z.number().int().positive().optional()
});
export type ProductoUpdate = z.infer<typeof ProductoUpdateSchema>;
