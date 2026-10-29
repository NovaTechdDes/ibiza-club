import z from "zod";
import { LARGO_PIN } from "../constantes.js";

export const LoginInputSchema = z.object({
    usuarioId: z.number().int().positive(),
    pin: z.string().regex(/^\d+$/).min(LARGO_PIN).max(12)
});

export type LoginInput = z.infer<typeof LoginInputSchema>;
