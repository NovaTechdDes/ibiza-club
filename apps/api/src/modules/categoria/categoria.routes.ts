import { Router } from "express";
import { actualizarCategoria, cambiarEstadoCategoria, crearCategoria, listarCategorias, obtenerCategoria } from "./categoria.service.js";
import { validar } from "../../middleware/validar.js";
import { IdParamSchema } from "../comun/id-param.js";
import { CategoriaInputSchema, CategoriaUpdateSchema } from "@ibiza/shared";

export const categoriaRouter: Router = Router();

categoriaRouter.get('/', async(_req, res) => {
    res.json(await listarCategorias())
});

categoriaRouter.get('/:id', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await obtenerCategoria(Number(req.params.id)))
});

categoriaRouter.post('/', validar({body: CategoriaInputSchema}), async(req, res) => {
    res.status(201).json(await crearCategoria(req.body))
})

categoriaRouter.patch('/:id', validar({params: IdParamSchema, body: CategoriaUpdateSchema}), async(req, res) => {
    res.json(await actualizarCategoria(Number(req.params.id), req.body))
});

categoriaRouter.post('/:id/baja', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoCategoria(Number(req.params.id), false))
});
categoriaRouter.post('/:id/alta', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoCategoria(Number(req.params.id), true))
});

