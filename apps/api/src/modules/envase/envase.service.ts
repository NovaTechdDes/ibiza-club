import { EnvaseInput, EnvaseUpdate } from "@ibiza/shared";
import { prisma } from "../../db/prisma.js"
import { AppError } from "../../errors/app-error.js";
import { escribirCatalogo } from "../comun/escritura-catalogo.js";

const seleccion = {
    id: true,
    nombre: true,
    orden: true,
    activo: true,
    version: true
}

export const listarEnvases = () => {
    return prisma.envase.findMany({
        select: seleccion,
        orderBy: [{ orden: 'asc'}, {nombre: 'asc'}]
    })
};

export const obtenerEnvase = async (id: number) => {
    const envase = await prisma.envase.findUnique({
        where: { id },
        select: seleccion
    });

    if(!envase){
        throw AppError.noEncontrado('Envase no encontrado')
    };

    return envase;
};

export const crearEnvase = async (input: EnvaseInput) => {
    try {
        return await escribirCatalogo('ENVASE_CREAR', input, (tx, version) => tx.envase.create({ data: {...input, version}}))
    } catch (error: any) {
        if (error.code === 'P2002') throw AppError.conflicto('Ya existe un envase con ese nombre')
        throw error
    }
};

export const actualizarEnvase = async (id: number, input: EnvaseUpdate) => {
    try {
        await obtenerEnvase(id);

        return await escribirCatalogo('ENVASE_ACTUALIZAR', input, (tx, version) =>
            tx.envase.update({ where: {id}, data: {...input, version}})
        )
    } catch (error: any) {
        if (error.code === 'P2002') throw AppError.conflicto('Ya existe un envase con ese nombre')
        throw error
    }
}

export const cambiarEstadoEnvase = async (id: number, activo: boolean) => {
    await obtenerEnvase(id);

    if(!activo){
        const conVariantes = await prisma.variante.count({ where: { envaseId: id, activo: true }})
        if(conVariantes) throw AppError.conflicto('El envase tiene variantes activas');
    }

    return await escribirCatalogo(activo ? 'ENVASE_ALTA' : 'ENVASE_BAJA', {activo}, (tx, version) =>
        tx.envase.update({ where: {id}, data: {activo, version}})
    )
}
