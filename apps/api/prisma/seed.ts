// Seed 8a: datos base de desarrollo (versión global, cajas y usuarios).
// Es IDEMPOTENTE: se puede correr varias veces sin duplicar filas.
// Uso: pnpm --filter @ibiza/api db:seed

import type { Rol } from "@ibiza/shared";
import { prisma } from "../src/db/prisma.js";
import { hashearPin } from "../src/utils/pin.js";

// Toda la configuración sembrada nace en la versión 1.
// Cuando la API cambie configuración (paso 9) subirá este número.
const VERSION_INICIAL = 1;

// ---------------------------------------------------------------
// Datos de prueba
// ---------------------------------------------------------------

const CAJAS = [
    { nombre: "Caja 1", barra: "Afuera" },
    { nombre: "Caja VIP", barra: "VIP" },
    { nombre: "Caja 2", barra: "Barra interior" },
];

// Los PINs son SOLO de desarrollo. En la base se guardan hasheados.
const USUARIOS: { nombre: string; rol: Rol; pin: string }[] = [
    { nombre: "Admin", rol: "ADMIN", pin: "1234" },
    { nombre: "Encargado", rol: "ENCARGADO", pin: "2345" },
    { nombre: "Cajero", rol: "CAJERO", pin: "3456" },
];

// ---------------------------------------------------------------
// Bloques del seed
// ---------------------------------------------------------------

// La tabla VersionConfig tiene una única fila (id = 1) con la versión global.
const sembrarVersion = async () => {
    await prisma.versionConfig.upsert({
        where: { id: 1 },
        create: { id: 1, actual: VERSION_INICIAL },
        update: { actual: VERSION_INICIAL },
    });
    console.log(`Versión global: ${VERSION_INICIAL}`);
};

// Caja.nombre es único, así que podemos usar upsert:
// si existe se actualiza, si no se crea.
const sembrarCajas = async () => {
    for (const caja of CAJAS) {
        await prisma.caja.upsert({
            where: { nombre: caja.nombre },
            create: { ...caja, version: VERSION_INICIAL },
            update: { barra: caja.barra },
        });
    }
    console.log(`Cajas: ${CAJAS.length}`);
};

// Usuario.nombre NO es único, así que no sirve upsert:
// buscamos por nombre y solo creamos si no existe.
// Si ya existe no tocamos el PIN (cada hash lleva un salt distinto
// y reescribirlo en cada corrida no aporta nada).
const sembrarUsuarios = async () => {
    for (const { nombre, rol, pin } of USUARIOS) {
        const existente = await prisma.usuario.findFirst({ where: { nombre } });
        if (existente) continue;

        await prisma.usuario.create({
            data: { nombre, rol, pinHash: hashearPin(pin), version: VERSION_INICIAL },
        });
    }
    console.log(`Usuarios: ${USUARIOS.length}`);
};

// ---------------------------------------------------------------
// Ejecución
// ---------------------------------------------------------------

const main = async () => {
    await sembrarVersion();
    await sembrarCajas();
    await sembrarUsuarios();
};

main()
    .catch((error) => {
        console.error("Falló el seed:", error);
        process.exitCode = 1;
    })
    // Siempre cerramos la conexión; si no, el proceso queda colgado.
    .finally(() => prisma.$disconnect());
