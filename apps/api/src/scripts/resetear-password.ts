// F24e: recupera el acceso al panel cuando alguien olvida su contraseña y no hay
// otro admin logueado que se la pueda cambiar. Pisa la contraseña de un AccesoPanel
// existente, buscado por email. No crea accesos ni toca el PIN ni el rol.
// Los datos entran por variables de entorno para que la contraseña no quede en el código.
// Uso (desarrollo): pnpm --filter @ibiza/api admin:password
// Uso (producción): node dist/scripts/resetear-password.js

import z from "zod";
import { LoginInputSchema, PasswordNuevaSchema } from "@ibiza/shared";
import { prisma } from "../db/prisma.js";
import { hashearSecreto } from "../utils/secreto.js";

// No van en env.ts: si estuvieran ahí, la API las exigiría para arrancar.
// Mismos nombres que en crear-admin para no tener que recordar otros.
const EntradaSchema = z.object({
    ADMIN_EMAIL: LoginInputSchema.shape.email,
    ADMIN_PASSWORD: PasswordNuevaSchema,
});

const resetearPassword = async () => {
    const entrada = EntradaSchema.safeParse(process.env);
    if (!entrada.success) {
        // Solo el nombre de la variable y el motivo: nunca el valor.
        for (const problema of entrada.error.issues) {
            console.error(`${problema.path.join(".")}: ${problema.message}`);
        }
        throw new Error("Faltan variables o son inválidas");
    }

    const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = entrada.data;

    const acceso = await prisma.$transaction(async (tx) => {
        const existente = await tx.accesoPanel.findUnique({ where: { email } });
        if (!existente) {
            throw new Error(`No hay ningún acceso al panel con el email ${email}. No se cambió nada.`);
        }

        // AccesoPanel no baja a las cajas: no sube la versión global (igual que en F15).
        await tx.accesoPanel.update({
            where: { id: existente.id },
            data: { passwordHash: hashearSecreto(password) },
        });

        await tx.auditoriaPanel.create({
            data: {
                usuarioId: existente.usuarioId,
                accion: "RESET_PASSWORD",
                detalle: JSON.stringify({ email, origen: "script" }),
            },
        });

        return existente;
    });

    console.log(`Contraseña actualizada: usuario id ${acceso.usuarioId}, email ${email}`);
};

try {
    await resetearPassword();
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}
