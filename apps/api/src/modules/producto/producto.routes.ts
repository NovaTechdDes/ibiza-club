import { Router } from "express";
import { z } from "zod";
import { actualizarProducto, cambiarEstadoProducto, crearProducto, listarProductos, obtenerProducto } from "./producto.service.js";
import { validar } from "../../middleware/validar.js";
import { IdParamSchema } from "../comun/id-param.js";
import { ProductoInputSchema, ProductoUpdateSchema } from "@ibiza/shared";
import { adminOEncargado, soloAdmin } from "../../middleware/autenticar.js";

const ListarQuerySchema = z.object({
    categoriaId: z.coerce.number().int().positive().optional()
});

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
