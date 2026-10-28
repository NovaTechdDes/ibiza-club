import { prisma } from "../../db/prisma.js";
import { AppError } from "../../errors/app-error.js";

// Lista blanca de campos: tokenHash NUNCA sale por la API
const seleccion = {
    id: true,
    nombre: true,
    activo: true,
    barra: true,
    version: true
} as const;

export const listarCajas = () => {
    return prisma.caja.findMany({
        select: seleccion,
        orderBy: { nombre: 'asc'}
    })
};

export const obtenerCaja = async(id: number) => {
    const caja = await prisma.caja.findUnique({
        where: {id},
        select: seleccion
    });
    if(!caja){
        throw AppError.noEncontrado('Caja no encontrada')
    }
    return caja
}