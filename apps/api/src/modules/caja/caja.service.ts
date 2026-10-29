import { prisma } from "../../db/prisma.js";
import { AppError } from "../../errors/app-error.js";
import { generarTokenDispositivo, hashearToken } from "../../utils/token-dispositivo.js";

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

// El token en claro se devuelve una sola vez; en la base queda solo el hash.
// No sube la versión global: el token no es configuración que baje a las cajas.
export const generarTokenCaja = async (usuarioId: number, cajaId: number) => {
    await obtenerCaja(cajaId);

    const token = generarTokenDispositivo();

    await prisma.$transaction([
        prisma.caja.update({ where: { id: cajaId }, data: { tokenHash: hashearToken(token) } }),
        // Nunca guardar el token ni su hash en el detalle
        prisma.auditoriaPanel.create({ data: { usuarioId, accion: 'CAJA_TOKEN_GENERAR', detalle: JSON.stringify({ cajaId }) } })
    ]);

    return { cajaId, token };
};

export const revocarTokenCaja = async (usuarioId: number, cajaId: number) => {
    await obtenerCaja(cajaId);

    const [caja] = await prisma.$transaction([
        prisma.caja.update({ where: { id: cajaId }, data: { tokenHash: null }, select: seleccion }),
        prisma.auditoriaPanel.create({ data: { usuarioId, accion: 'CAJA_TOKEN_REVOCAR', detalle: JSON.stringify({ cajaId }) } })
    ]);

    return caja;
};
