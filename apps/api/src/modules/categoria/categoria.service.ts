import { CategoriaInput, CategoriaUpdate } from "@ibiza/shared";
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

export const listarCategorias = () => {
    return prisma.categoria.findMany({
        select: seleccion,
        orderBy: [{ orden: 'asc'}, {nombre: 'asc'}]
    })
};

export const obtenerCategoria = async (id: number ) => {
    const categoria = await prisma.categoria.findUnique({
        where: { id },
        select: seleccion
    });

    if(!categoria){
        throw AppError.noEncontrado('Categoria no encontrada')
    };

    return categoria;
};

export const crearCategoria = async (input: CategoriaInput) => {
    try {
        return await escribirCatalogo('CATEGORIA_CREAR', input, (tx, version) => tx.categoria.create({ data: {...input,  version}}))
    } catch (error: any) {
        if (error.code === 'P2002' )throw AppError.conflicto('Ya existe una categoria con ese nombre')
            throw error
    }
};

export const actualizarCategoria = async(id: number, input: CategoriaUpdate) => {
    try {
        await obtenerCategoria(id);

        return await escribirCatalogo('CATEGORIA_ACTUALIZAR', input, (tx, version) => 
            tx.categoria.update({ where: {id}, data: {...input, version}})
        )
    } catch (error: any) {
        if (error.code === 'P2002' )throw AppError.conflicto('Ya existe una categoria con ese nombre')
            throw error
    }
}

export const cambiarEstadoCategoria = async (id: number, activo: boolean) => {
    await obtenerCategoria(id);

    if(!activo){
        const conProductos = await prisma.producto.count({where: { categoriaId: id, activo: true}})
        if(conProductos) throw AppError.conflicto('La categoria tiene productos activos');
    }

    return await escribirCatalogo(activo ? 'CATEGORIA_ALTA' : 'CATEGORIA_BAJA', {activo}, (tx, version) =>
        tx.categoria.update({ where: {id}, data: {activo, version}})
    )
}