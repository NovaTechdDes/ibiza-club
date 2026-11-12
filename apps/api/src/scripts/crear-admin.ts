// F14d: crea el PRIMER admin del panel. Es de un solo uso: si ya hay un admin
// con acceso al panel, no hace nada. Los datos entran por variables de entorno
// para que la contraseña no quede en el código ni en el repo.
// Uso (desarrollo): pnpm --filter @ibiza/api admin:crear
// Uso (producción): node dist/scripts/crear-admin.js

import z from "zod";
import { LoginInputSchema, UsuarioInputSchema, type Rol } from "@ibiza/shared";
import { prisma } from "../db/prisma.js";
import { hashearSecreto } from "../utils/secreto.js";

// No van en env.ts: si estuvieran ahí, la API las exigiría para arrancar.
const EntradaSchema = z.object({
    ADMIN_NOMBRE: UsuarioInputSchema.shape.nombre,
    ADMIN_PIN: UsuarioInputSchema.shape.pin,
    ADMIN_EMAIL: LoginInputSchema.shape.email,
    ADMIN_PASSWORD: z.string().min(12).max(128),
});

const ROL_ADMIN: Rol = "ADMIN";

const crearAdmin = async () => {
    const entrada = EntradaSchema.safeParse(process.env);
    if (!entrada.success) {
        // Solo el nombre de la variable y el motivo: nunca el valor.
        for (const problema of entrada.error.issues) {
            console.error(`${problema.path.join(".")}: ${problema.message}`);
        }
        throw new Error("Faltan variables o son inválidas");
    }

    const { ADMIN_NOMBRE: nombre, ADMIN_PIN: pin, ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = entrada.data;

    const usuario = await prisma.$transaction(async (tx) => {
        // Candado: el script solo sirve para arrancar una base sin admin.
        // Va dentro de la transacción para que el chequeo y el alta sean una sola cosa.
        const existente = await tx.usuario.findFirst({
            where: { rol: ROL_ADMIN, activo: true, accesoPanel: { isNot: null } },
        });
        if (existente) {
            throw new Error(`Ya existe un admin con acceso al panel (id ${existente.id}). No se creó nada.`);
        }

        // El usuario es configuración que baja a las cajas: sube la versión global.
        const { actual: version } = await tx.versionConfig.update({
            where: { id: 1 },
            data: { actual: { increment: 1 } },
        });

        const creado = await tx.usuario.create({
            data: {
                nombre,
                rol: ROL_ADMIN,
                pinHash: hashearSecreto(pin),
                version,
                accesoPanel: { create: { email, passwordHash: hashearSecreto(password) } },
            },
        });

        await tx.auditoriaPanel.create({
            data: {
                usuarioId: creado.id,
                accion: "PRIMER_ADMIN",
                detalle: JSON.stringify({ nombre, email }),
            },
        });

        return creado;
    });

    console.log(`Admin creado: id ${usuario.id}, nombre "${usuario.nombre}", email ${email}`);
};

try {
    await crearAdmin();
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}
