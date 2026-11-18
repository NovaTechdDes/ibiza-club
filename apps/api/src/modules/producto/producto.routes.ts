import express, { Router } from "express";
import { z } from "zod";
import { actualizarProducto, cambiarEstadoProducto, cambiarImagenProducto, crearProducto, listarProductos, obtenerProducto, quitarImagenProducto } from "./producto.service.js";
import { validar } from "../../middleware/validar.js";
import { IdParamSchema } from "../comun/id-param.js";
import { ProductoInputSchema, ProductoUpdateSchema, TAMANIO_MAXIMO_IMAGEN, TIPOS_IMAGEN } from "@ibiza/shared";
import { adminOEncargado, soloAdmin } from "../../middleware/autenticar.js";
import { AppError } from "../../errors/app-error.js";

const ListarQuerySchema = z.object({
    categoriaId: z.coerce.number().int().positive().optional()
});

const leerImagen = express.raw({ type: TIPOS_IMAGEN, limit: TAMANIO_MAXIMO_IMAGEN})

export const productoRouter: Router = Router();

productoRouter.get('/', adminOEncargado, validar({query: ListarQuerySchema}), async(req, res) => {
    const { categoriaId } = req.query as z.infer<typeof ListarQuerySchema>;
    res.json(await listarProductos(categoriaId))
});

productoRouter.get('/:id', adminOEncargado, validar({params: IdParamSchema}), async(req, res) => {
    res.json(await obtenerProducto(Number(req.params.id)))
});

productoRouter.post('/', soloAdmin, validar({body: ProductoInputSchema}), async(req, res) => {
    res.status(201).json(await crearProducto(req.usuarioId!, req.body))
});

productoRouter.patch('/:id', soloAdmin, validar({params: IdParamSchema, body: ProductoUpdateSchema}), async(req, res) => {
    res.json(await actualizarProducto(req.usuarioId!, Number(req.params.id), req.body))
});

productoRouter.post('/:id/baja', soloAdmin, validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoProducto(req.usuarioId!, Number(req.params.id), false))
});

productoRouter.post('/:id/alta', soloAdmin, validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoProducto(req.usuarioId!, Number(req.params.id), true))
});


productoRouter.put('/:id/imagen', soloAdmin, validar({params: IdParamSchema}), leerImagen, async(req, res) => {
    if(!Buffer.isBuffer(req.body) || req.body.length === 0){
        throw new AppError(400, "VALIDACION", "Manda la imagen en el cuerpo de Content-Type image/jpeg, image/png o image/webp")
    }
    res.json(await cambiarImagenProducto(req.usuarioId!, Number(req.params.id), req.body));
});



productoRouter.delete('/:id/imagen', soloAdmin, validar({params: IdParamSchema}), async(req, res) => {
    res.json(await quitarImagenProducto(req.usuarioId!, Number(req.params.id)))
});
