import { Router } from "express";
import { actualizarEnvase, cambiarEstadoEnvase, crearEnvase, listarEnvases, obtenerEnvase } from "./envase.service.js";
import { validar } from "../../middleware/validar.js";
import { IdParamSchema } from "../comun/id-param.js";
import { EnvaseInputSchema, EnvaseUpdateSchema } from "@ibiza/shared";
import { adminOEncargado, soloAdmin } from "../../middleware/autenticar.js";

export const envaseRouter: Router = Router();

envaseRouter.get('/', adminOEncargado, async(_req, res) => {
    res.json(await listarEnvases())
});

envaseRouter.get('/:id', adminOEncargado, validar({params: IdParamSchema}), async(req, res) => {
    res.json(await obtenerEnvase(Number(req.params.id)))
});

envaseRouter.post('/', soloAdmin, validar({body: EnvaseInputSchema}), async(req, res) => {
    res.status(201).json(await crearEnvase(req.usuarioId!, req.body))
});

envaseRouter.patch('/:id', soloAdmin, validar({params: IdParamSchema, body: EnvaseUpdateSchema}), async(req, res) => {
    res.json(await actualizarEnvase(req.usuarioId!, Number(req.params.id), req.body))
});

envaseRouter.post('/:id/baja', soloAdmin, validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoEnvase(req.usuarioId!, Number(req.params.id), false))
});
envaseRouter.post('/:id/alta', soloAdmin, validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoEnvase(req.usuarioId!, Number(req.params.id), true))
});
