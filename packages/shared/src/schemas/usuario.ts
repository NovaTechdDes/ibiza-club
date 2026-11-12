import z from "zod";
import { LARGO_NOMBRE, LARGO_PIN } from "../constantes.js";
import { ROLES } from "../roles.js";

export const UsuarioInputSchema = z.object({
    nombre: z.string().trim().min(1).max(LARGO_NOMBRE),
    rol: z.enum(ROLES),
    pin: z.string().regex(/^\d+$/).length(LARGO_PIN)
})


export const UsuarioSchema = z.object({
    id: z.number().int().positive(),
    nombre: z.string().trim().min(1).max(LARGO_NOMBRE),
    rol: z.enum(ROLES),
    pinHash: z.string().min(1),
    activo: z.boolean(),
    version: z.number().int().min(0)
});

// Editar: el PIN no va acá, tiene su propia ruta para que quede auditado aparte.
export const UsuarioUpdateSchema = z.object({
    nombre: UsuarioInputSchema.shape.nombre.optional(),
    rol: UsuarioInputSchema.shape.rol.optional()
});

export const UsuarioPinSchema = z.object({
    pin: UsuarioInputSchema.shape.pin
});

export type UsuarioInput = z.infer<typeof UsuarioInputSchema>;
export type UsuarioUpdate = z.infer<typeof UsuarioUpdateSchema>;
export type UsuarioPin = z.infer<typeof UsuarioPinSchema>;
export type Usuario = z.infer<typeof UsuarioSchema>