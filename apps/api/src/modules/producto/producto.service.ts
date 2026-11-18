import { ProductoInput, ProductoUpdate } from "@ibiza/shared";
import { prisma } from "../../db/prisma.js"
import { AppError } from "../../errors/app-error.js";
import { escribirCatalogo } from "../comun/escritura-catalogo.js";
import { borrarImagen, subirImagenProducto } from "../../storage/imagenes.js";
import { logger } from "../../config/logger.js";


const seleccion = {
    id: true,
    nombre: true,
    orden: true,
    activo: true,
    version: true,
    categoriaId: true,
    imagenUrl: true,
    categoria: { select: { id: true, nombre: true } }
}

const MENSAJE_DUPLICADO = 'Ya existe un producto con ese nombre en la categoria';

const validarCategoria = async (categoriaId: number) => {
    const categoria = await prisma.categoria.findUnique({
        where: { id: categoriaId },
        select: { activo: true }
    });

    if(!categoria){
        throw AppError.noEncontrado('Categoria no encontrada')
    };
    if(!categoria.activo){
        throw AppError.conflicto('La categoria esta inactiva')
    };
};

export const listarProductos = (categoriaId?: number) => {
    return prisma.producto.findMany({
        where: categoriaId ? { categoriaId } : undefined,
        select: seleccion,
        orderBy: [{ categoriaId: 'asc' }, { orden: 'asc'}, { nombre: 'asc'}]
    })
};

export const obtenerProducto = async (id: number) => {
    const producto = await prisma.producto.findUnique({
        where: { id },
        select: seleccion
    });

    if(!producto){
        throw AppError.noEncontrado('Producto no encontrado')
    };

    return producto;
};

export const crearProducto = async (usuarioId: number, input: ProductoInput) => {
    await validarCategoria(input.categoriaId);

    try {
        return await escribirCatalogo(usuarioId, 'PRODUCTO_CREAR', input, (tx, version) =>
            tx.producto.create({ data: {...input, version}, select: seleccion })
        )
    } catch (error: any) {
        if (error.code === 'P2002') throw AppError.conflicto(MENSAJE_DUPLICADO)
        throw error
    }
};

export const actualizarProducto = async (usuarioId: number, id: number, input: ProductoUpdate) => {
    await obtenerProducto(id);

    if(input.categoriaId !== undefined){
        await validarCategoria(input.categoriaId);
    }

    try {
        return await escribirCatalogo(usuarioId, 'PRODUCTO_ACTUALIZAR', input, (tx, version) =>
            tx.producto.update({ where: {id}, data: {...input, version}, select: seleccion })
        )
    } catch (error: any) {
        if (error.code === 'P2002') throw AppError.conflicto(MENSAJE_DUPLICADO)
        throw error
    }
};

export const cambiarEstadoProducto = async (usuarioId: number, id: number, activo: boolean) => {
    const producto = await obtenerProducto(id);

    if(activo){
        await validarCategoria(producto.categoriaId);
    } else {
        const conVariantes = await prisma.variante.count({ where: { productoId: id, activo: true }})
        if(conVariantes) throw AppError.conflicto('El producto tiene variantes activas');
    }

    return await escribirCatalogo(usuarioId, activo ? 'PRODUCTO_ALTA' : 'PRODUCTO_BAJA', {activo}, (tx, version) =>
        tx.producto.update({ where: {id}, data: {activo, version}, select: seleccion })
    )
};


const borrarSinFallar = async (url: string) => {
    try {
        await borrarImagen(url);
    } catch (err) {
        logger.warn({err, url}, "No se pudo borrar la imagen del Blob Storage")
    }
}

export const cambiarImagenProducto = async(usuarioId:number, id: number, datos: Buffer) => {
    const {imagenUrl: vieja} = await obtenerProducto(id);
    const nueva = await subirImagenProducto(id, datos);

    const producto = await escribirCatalogo(usuarioId, "PRODUCTO_IMAGEN", { productoId: id, imagenUrl: nueva}, (tx, version) =>
        tx.producto.update({where: {id}, data: {imagenUrl: nueva, version}, select: seleccion})
    )
    .catch(async (error) => {
        await borrarSinFallar(nueva);
        throw error;
    });

    if (vieja) await borrarSinFallar(vieja);

    return producto;
}

export const quitarImagenProducto = async(usuarioId: number, id: number) => {
    const producto = await obtenerProducto(id);

    if (!producto.imagenUrl) return producto;
    const vieja = producto.imagenUrl;

    const actualizado = await escribirCatalogo(usuarioId, "PRODUCTO_IMAGEN_QUITAR", {productoId: id, imagenAnterior: vieja}, (tx, version) => 
        tx.producto.update({where: {id}, data: {imagenUrl: null, version}, select: seleccion})    
    );

    await borrarSinFallar(vieja);

    return actualizado
}