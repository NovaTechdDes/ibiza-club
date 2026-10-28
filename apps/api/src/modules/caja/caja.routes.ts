import { Router } from "express";
import { listarCajas, obtenerCaja } from "./caja.service.js";
import { validar } from "../../middleware/validar.js";
import { IdParamSchema } from "../comun/id-param.js";

export const cajaRouter: Router = Router();

cajaRouter.get('/', async(_req, res) => {
    res.json(await listarCajas())
});
cajaRouter.get('/:id', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await obtenerCaja(Number(req.params.id)))
});