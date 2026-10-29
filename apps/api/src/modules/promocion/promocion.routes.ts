import { Router } from "express";
import { actualizarPromocion, cambiarEstadoPromocion, cambiarPausaPromocion, crearPromocion, listarPromociones, obtenerPromocion } from "./promocion.service.js";
import { validar } from "../../middleware/validar.js";
import { IdParamSchema } from "../comun/id-param.js";
import { PromocionInputSchema } from "@ibiza/shared";

export const promocionRouter: Router = Router();

promocionRouter.get('/', async(_req, res) => {
    res.json(await listarPromociones())
});

promocionRouter.get('/:id', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await obtenerPromocion(Number(req.params.id)))
});

promocionRouter.post('/', validar({body: PromocionInputSchema}), async(req, res) => {
    res.status(201).json(await crearPromocion(req.usuarioId!, req.body))
});

promocionRouter.put('/:id', validar({params: IdParamSchema, body: PromocionInputSchema}), async(req, res) => {
    res.json(await actualizarPromocion(req.usuarioId!, Number(req.params.id), req.body))
});

promocionRouter.post('/:id/pausar', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarPausaPromocion(req.usuarioId!, Number(req.params.id), true))
});
promocionRouter.post('/:id/reanudar', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarPausaPromocion(req.usuarioId!, Number(req.params.id), false))
});

promocionRouter.post('/:id/baja', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoPromocion(req.usuarioId!, Number(req.params.id), false))
});
promocionRouter.post('/:id/alta', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoPromocion(req.usuarioId!, Number(req.params.id), true))
});
