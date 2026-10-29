import { Router } from "express";
import { z } from "zod";
import { actualizarProducto, cambiarEstadoProducto, crearProducto, listarProductos, obtenerProducto } from "./producto.service.js";
import { validar } from "../../middleware/validar.js";
import { IdParamSchema } from "../comun/id-param.js";
import { ProductoInputSchema, ProductoUpdateSchema } from "@ibiza/shared";

const ListarQuerySchema = z.object({
    categoriaId: z.coerce.number().int().positive().optional()
});

export const productoRouter: Router = Router();

productoRouter.get('/', validar({query: ListarQuerySchema}), async(req, res) => {
    const { categoriaId } = req.query as z.infer<typeof ListarQuerySchema>;
    res.json(await listarProductos(categoriaId))
});

productoRouter.get('/:id', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await obtenerProducto(Number(req.params.id)))
});

productoRouter.post('/', validar({body: ProductoInputSchema}), async(req, res) => {
    res.status(201).json(await crearProducto(req.body))
});

productoRouter.patch('/:id', validar({params: IdParamSchema, body: ProductoUpdateSchema}), async(req, res) => {
    res.json(await actualizarProducto(Number(req.params.id), req.body))
});

productoRouter.post('/:id/baja', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoProducto(Number(req.params.id), false))
});
productoRouter.post('/:id/alta', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoProducto(Number(req.params.id), true))
});
