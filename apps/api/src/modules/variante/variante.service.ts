import { VarianteInput, VarianteUpdate } from "@ibiza/shared";
import { prisma } from "../../db/prisma.js"
import { AppError } from "../../errors/app-error.js";
import { escribirCatalogo } from "../comun/escritura-catalogo.js";

const seleccion = {
    id: true,
    precio: true,
    activo: true,
    version: true,
    productoId: true,
    envaseId: true,
    producto: { select: { id: true, nombre: true } },
    envase: { select: { id: true, nombre: true } }
}

const MENSAJE_DUPLICADO = 'Ya existe una variante de ese producto con ese envase';

const validarProductoYEnvase = async (productoId: number, envaseId: number) => {
    const [producto, envase] = await Promise.all([
        prisma.producto.findUnique({ where: { id: productoId }, select: { activo: true } }),
        prisma.envase.findUnique({ where: { id: envaseId }, select: { activo: true } })
    ]);

    if(!producto) throw AppError.noEncontrado('Producto no encontrado');
    if(!envase) throw AppError.noEncontrado('Envase no encontrado');
    if(!producto.activo) throw AppError.conflicto('El producto esta inactivo');
    if(!envase.activo) throw AppError.conflicto('El envase esta inactivo');
};

export const listarVariantes = (filtro: { productoId?: number, envaseId?: number } = {}) => {
    return prisma.variante.findMany({
        where: filtro,
        select: seleccion,
        orderBy: [{ productoId: 'asc' }, { envaseId: 'asc' }]
    })
};

export const obtenerVariante = async (id: number) => {
    const variante = await prisma.variante.findUnique({
        where: { id },
        select: seleccion
    });

    if(!variante){
        throw AppError.noEncontrado('Variante no encontrada')
    };

    return variante;
};

export const crearVariante = async (input: VarianteInput) => {
    await validarProductoYEnvase(input.productoId, input.envaseId);

    try {
        return await escribirCatalogo('VARIANTE_CREAR', input, (tx, version) =>
            tx.variante.create({ data: {...input, version}, select: seleccion })
        )
    } catch (error: any) {
        if (error.code === 'P2002') throw AppError.conflicto(MENSAJE_DUPLICADO)
        throw error
    }
};

export const actualizarVariante = async (id: number, input: VarianteUpdate) => {
    await obtenerVariante(id);

    return await escribirCatalogo('VARIANTE_ACTUALIZAR', input, (tx, version) =>
        tx.variante.update({ where: {id}, data: {...input, version}, select: seleccion })
    )
};

export const cambiarEstadoVariante = async (id: number, activo: boolean) => {
    const variante = await obtenerVariante(id);

    if(activo){
        await validarProductoYEnvase(variante.productoId, variante.envaseId);
    }

    return await escribirCatalogo(activo ? 'VARIANTE_ALTA' : 'VARIANTE_BAJA', {activo}, (tx, version) =>
        tx.variante.update({ where: {id}, data: {activo, version}, select: seleccion })
    )
};
