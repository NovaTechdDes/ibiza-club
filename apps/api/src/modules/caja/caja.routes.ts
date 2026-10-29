import { Router } from "express";
import { generarTokenCaja, listarCajas, obtenerCaja, revocarTokenCaja } from "./caja.service.js";
import { validar } from "../../middleware/validar.js";
import { IdParamSchema } from "../comun/id-param.js";

export const cajaRouter: Router = Router();

cajaRouter.get('/', async(_req, res) => {
    res.json(await listarCajas())
});
cajaRouter.get('/:id', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await obtenerCaja(Number(req.params.id)))
});

cajaRouter.post('/:id/token', validar({params: IdParamSchema}), async(req, res) => {
    res.status(201).json(await generarTokenCaja(req.usuarioId!, Number(req.params.id)))
});
cajaRouter.delete('/:id/token', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await revocarTokenCaja(req.usuarioId!, Number(req.params.id)))
});
