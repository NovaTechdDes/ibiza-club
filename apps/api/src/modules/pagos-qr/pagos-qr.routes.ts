import { Router } from "express";
import z from "zod";
import { validar } from "../../middleware/validar.js";
import { CrearOrdenQrSchema, OrdenIdSchema } from "@ibiza/shared";
import { cancelarOrden, consultarOrden, crearOrden } from "./pagos-qr.service.js";

export const pagosQrRouter: Router = Router();

const ParamsOrden = z.object({ ordenId: OrdenIdSchema });

pagosQrRouter.post('/', validar({ body: CrearOrdenQrSchema}), async (req, res) => {
    res.status(201).json(await crearOrden(req.cajaId!, req.body.total, req.body.clave))
});

pagosQrRouter.post('/:ordenId/cancelar', validar({params: ParamsOrden}), async (req, res) => {
    res.json(await cancelarOrden(req.cajaId!, req.params.ordenId as string))
})
pagosQrRouter.get('/:ordenId', validar({params: ParamsOrden}), async (req, res) => {
    res.json(await consultarOrden(req.cajaId!, req.params.ordenId as string, ))
})
