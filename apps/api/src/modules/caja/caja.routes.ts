import { Router } from "express";
import { CajaInputSchema, CajaUpdateSchema } from "@ibiza/shared";
import { actualizarCaja, cambiarEstadoCaja, crearCaja, generarTokenCaja, listarCajas, obtenerCaja, revocarTokenCaja } from "./caja.service.js";
import { validar } from "../../middleware/validar.js";
import { IdParamSchema } from "../comun/id-param.js";

// Todo el router es solo Admin: routes.ts lo monta con autenticar + soloAdmin.
export const cajaRouter: Router = Router();

cajaRouter.get('/', async(_req, res) => {
    res.json(await listarCajas())
});
cajaRouter.get('/:id', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await obtenerCaja(Number(req.params.id)))
});

cajaRouter.post('/', validar({body: CajaInputSchema}), async(req, res) => {
    res.status(201).json(await crearCaja(req.usuarioId!, req.body))
});

cajaRouter.patch('/:id', validar({params: IdParamSchema, body: CajaUpdateSchema}), async(req, res) => {
    res.json(await actualizarCaja(req.usuarioId!, Number(req.params.id), req.body))
});

cajaRouter.post('/:id/baja', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoCaja(req.usuarioId!, Number(req.params.id), false))
});
cajaRouter.post('/:id/alta', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoCaja(req.usuarioId!, Number(req.params.id), true))
});

cajaRouter.post('/:id/token', validar({params: IdParamSchema}), async(req, res) => {
    res.status(201).json(await generarTokenCaja(req.usuarioId!, Number(req.params.id)))
});
cajaRouter.delete('/:id/token', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await revocarTokenCaja(req.usuarioId!, Number(req.params.id)))
});
