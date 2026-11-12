import type { CajaInput, CajaUpdate } from "@ibiza/shared";
import { prisma } from "../../db/prisma.js";
import { escribirCatalogo } from "../comun/escritura-catalogo.js";
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

const NOMBRE_REPETIDO = 'Ya existe una caja con ese nombre';

export const crearCaja = async (usuarioId: number, input: CajaInput) => {
    try {
        return await escribirCatalogo(usuarioId, 'CAJA_CREAR', input, (tx, version) =>
            tx.caja.create({ data: { nombre: input.nombre, barra: input.barra ?? null, version }, select: seleccion })
        );
    } catch (error: any) {
        if (error.code === 'P2002') throw AppError.conflicto(NOMBRE_REPETIDO);
        throw error;
    }
};

export const actualizarCaja = async (usuarioId: number, id: number, input: CajaUpdate) => {
    await obtenerCaja(id);

    try {
        return await escribirCatalogo(usuarioId, 'CAJA_ACTUALIZAR', { cajaId: id, ...input }, (tx, version) =>
            tx.caja.update({
                where: { id },
                data: {
                    // undefined = no vino en el body, no se toca. null en barra = quitarla.
                    ...(input.nombre !== undefined && { nombre: input.nombre }),
                    ...(input.barra !== undefined && { barra: input.barra }),
                    version
                },
                select: seleccion
            })
        );
    } catch (error: any) {
        if (error.code === 'P2002') throw AppError.conflicto(NOMBRE_REPETIDO);
        throw error;
    }
};

// La baja no revoca el token: requerirCaja ya rechaza a una caja inactiva,
// y al darla de alta de nuevo la PC sigue vinculada.
export const cambiarEstadoCaja = async (usuarioId: number, id: number, activo: boolean) => {
    await obtenerCaja(id);

    return escribirCatalogo(usuarioId, activo ? 'CAJA_ALTA' : 'CAJA_BAJA', { cajaId: id, activo }, (tx, version) =>
        tx.caja.update({ where: { id }, data: { activo, version }, select: seleccion })
    );
};

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
