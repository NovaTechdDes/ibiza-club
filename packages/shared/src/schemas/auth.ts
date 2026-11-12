import z from "zod";

export const LoginInputSchema = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
    password: z.string().min(1).max(128)
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

// Regla para contraseñas NUEVAS. El login no la usa: ahí alcanza con que no venga vacía.
export const LARGO_MIN_PASSWORD = 12;
export const PasswordNuevaSchema = z.string().min(LARGO_MIN_PASSWORD).max(128);

// Un admin le da (o le reemplaza) el acceso al panel a un usuario.
export const AccesoPanelInputSchema = z.object({
    email: LoginInputSchema.shape.email,
    password: PasswordNuevaSchema
});
export type AccesoPanelInput = z.infer<typeof AccesoPanelInputSchema>;

// Cada uno cambia su propia contraseña, demostrando que sabe la actual.
export const CambiarPasswordSchema = z.object({
    actual: LoginInputSchema.shape.password,
    nueva: PasswordNuevaSchema
});
export type CambiarPassword = z.infer<typeof CambiarPasswordSchema>;
