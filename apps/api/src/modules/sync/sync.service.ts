import { prisma } from "../../db/prisma.js"
import { AppError } from "../../errors/app-error.js";

export const obtenerCambios = async (cajaId: number, desde: number) => {
    // Prime se fija el tope, CAda escritura de catalogo bloque versionconfig
    // hasta confirmar, asi que todo lo que tenga version <= hasta ya esta completo
    const { actual: hasta} = await prisma.versionConfig.findUniqueOrThrow({ where: {id: 1}});


    // La caja dice tener una version que la nube no conoce
    // Tiene que borrar su catalogo y volver a pedir desde 0
    if (desde > hasta){
        throw AppError.conflicto('La version de la caja es mayor que la de la nube')
    };

    const where = { version: {gt: desde, lte: hasta}};

    const [ caja, envases, categorias, productos, variantes, promociones, promocionAlcances, promocionEnvases, usuarios] = 
    await Promise.all([
        prisma.caja.findUniqueOrThrow({ where: {id: cajaId}, select: { id: true, nombre: true, barra: true}}),
        prisma.envase.findMany({ where, select: {id: true, nombre: true, orden: true, activo: true, version: true}}),
        prisma.categoria.findMany({ where, select: {
            id: true, nombre: true, orden: true, activo: true, version: true
        }}),
        prisma.producto.findMany({
            where,
            select: {id: true, categoriaId: true, nombre: true, orden: true, activo: true, version: true}
        }),
        prisma.variante.findMany({
            where,
            select: {id: true, productoId: true, envaseId: true, precio: true, activo: true, version: true}
        }),
        prisma.promocion.findMany({
            where,
            select: {
                id: true, nombre: true, tipo: true, llevar: true, pagar: true, porcentaje: true, monto: true, dias: true, horaDesde: true, horaHasta: true, pausada: true, activo: true, version: true
            }
        }),
        prisma.promocionAlcance.findMany({
            where,
            select: { id: true, promocionId: true, productoId: true, categoriaId: true,
                activo: true, version: true
            }
        }),
        prisma.promocionEnvase.findMany({
            where,
            select: { id: true, promocionId: true, envaseId: true, activo: true, version: true}
        }),
        // El pinHash baja porque el PIN se valida en la caja, sin internet
        prisma.usuario.findMany({
            where,
            select: {id: true, nombre: true, rol: true, pinHash: true, activo: true, version: true}
        })
    ]);
    return {
        version: hasta,
        ahora: new Date().toISOString(),
        caja,
        cambios: { envases, categorias, productos, variantes, promociones, promocionAlcances, promocionEnvases, usuarios}
    };
};
