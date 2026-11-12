import { Router } from "express";
import { actualizarCategoria, cambiarEstadoCategoria, crearCategoria, listarCategorias, obtenerCategoria } from "./categoria.service.js";
import { validar } from "../../middleware/validar.js";
import { IdParamSchema } from "../comun/id-param.js";
import { CategoriaInputSchema, CategoriaUpdateSchema } from "@ibiza/shared";
import { adminOEncargado, soloAdmin } from "../../middleware/autenticar.js";

export const categoriaRouter: Router = Router();

categoriaRouter.get('/', adminOEncargado, async(_req, res) => {
    res.json(await listarCategorias())
});

categoriaRouter.get('/:id', adminOEncargado, validar({params: IdParamSchema}), async(req, res) => {
    res.json(await obtenerCategoria(Number(req.params.id)))
});

categoriaRouter.post('/', soloAdmin, validar({body: CategoriaInputSchema}), async(req, res) => {
    res.status(201).json(await crearCategoria(req.usuarioId!, req.body))
})

categoriaRouter.patch('/:id', soloAdmin, validar({params: IdParamSchema, body: CategoriaUpdateSchema}), async(req, res) => {
    res.json(await actualizarCategoria(req.usuarioId!, Number(req.params.id), req.body))
});

categoriaRouter.post('/:id/baja', soloAdmin, validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoCategoria(req.usuarioId!, Number(req.params.id), false))
});
categoriaRouter.post('/:id/alta', soloAdmin, validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoCategoria(req.usuarioId!, Number(req.params.id), true))
});

