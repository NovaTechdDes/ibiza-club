import {z} from "zod";
import { LARGO_NOMBRE_CORTO } from "../constantes.js";

export const EnvaseInputSchema = z.object({
    nombre: z.string().trim().min(1).max(LARGO_NOMBRE_CORTO),
    orden: z.number().int().min(0).default(0)
});

export const EnvaseSchema = EnvaseInputSchema.extend({
    id: z.number().int().positive(),
    activo: z.boolean(),
    version: z.number().int().min(0)
});


export type EnvaseInput = z.infer<typeof EnvaseInputSchema>
export type Envase = z.infer<typeof EnvaseSchema>