import z from "zod";

export const VarianteInputSchema = z.object({
    productoId: z.number().int().positive(),
    envaseId: z.number().int().positive(),
    precio: z.number().int().positive(),
});

export const VarianteSchema = VarianteInputSchema.extend({
    id: z.number().int().positive(),
    activo: z.boolean(),
    version: z.number().int().min(0)
});

export type VarianteInput = z.infer<typeof VarianteInputSchema>
export type Variante = z.infer<typeof VarianteSchema>

export const VarianteUpdateSchema = z.object({
    precio: VarianteInputSchema.shape.precio
});
export type VarianteUpdate = z.infer<typeof VarianteUpdateSchema>;
