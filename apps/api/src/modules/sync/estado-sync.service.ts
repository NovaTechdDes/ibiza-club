import { prisma } from "../../db/prisma.js";
import { logger } from "../../config/logger.js";

type DatosContacto = {
    versionCatalogo?: number;
    ultimaSubidaEn?: Date;
};

// Es solo monitoreo: si falla se loguea y sigue, nunca puede frenar la sincronización de la caja.
// Los campos que no vienen quedan como estaban: una subida no pisa la versión de catálogo, y al revés.
export const registrarContacto = async (cajaId: number, datos: DatosContacto = {}) => {
    const ultimoContactoEn = new Date();
    try {
        await prisma.estadoSyncCaja.upsert({
            where: { cajaId },
            create: { cajaId, ultimoContactoEn, ...datos },
            update: { ultimoContactoEn, ...datos }
        });
    } catch (error) {
        logger.error({ err: error, cajaId }, "No se pudo registrar el contacto de la caja");
    }
};
