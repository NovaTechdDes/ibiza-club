import { Router } from "express";
import { z } from "zod";
import { actualizarVariante, cambiarEstadoVariante, crearVariante, listarVariantes, obtenerVariante } from "./variante.service.js";
import { validar } from "../../middleware/validar.js";
import { IdParamSchema } from "../comun/id-param.js";
import { VarianteInputSchema, VarianteUpdateSchema } from "@ibiza/shared";

const ListarQuerySchema = z.object({
    productoId: z.coerce.number().int().positive().optional(),
    envaseId: z.coerce.number().int().positive().optional()
});

export const varianteRouter: Router = Router();

varianteRouter.get('/', validar({query: ListarQuerySchema}), async(req, res) => {
    const { productoId, envaseId } = req.query as z.infer<typeof ListarQuerySchema>;
    res.json(await listarVariantes({
        ...(productoId !== undefined && { productoId }),
        ...(envaseId !== undefined && { envaseId })
    }))
});

varianteRouter.get('/:id', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await obtenerVariante(Number(req.params.id)))
});

varianteRouter.post('/', validar({body: VarianteInputSchema}), async(req, res) => {
    res.status(201).json(await crearVariante(req.body))
});

varianteRouter.patch('/:id', validar({params: IdParamSchema, body: VarianteUpdateSchema}), async(req, res) => {
    res.json(await actualizarVariante(Number(req.params.id), req.body))
});

varianteRouter.post('/:id/baja', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoVariante(Number(req.params.id), false))
});
varianteRouter.post('/:id/alta', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoVariante(Number(req.params.id), true))
});
