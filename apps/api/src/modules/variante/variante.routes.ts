import { Router } from "express";
import { z } from "zod";
import { actualizarVariante, cambiarEstadoVariante, crearVariante, listarVariantes, obtenerVariante } from "./variante.service.js";
import { validar } from "../../middleware/validar.js";
import { IdParamSchema } from "../comun/id-param.js";
import { VarianteInputSchema, VarianteUpdateSchema } from "@ibiza/shared";
import { adminOEncargado, soloAdmin } from "../../middleware/autenticar.js";

const ListarQuerySchema = z.object({
    productoId: z.coerce.number().int().positive().optional(),
    envaseId: z.coerce.number().int().positive().optional()
});

export const varianteRouter: Router = Router();

varianteRouter.get('/', adminOEncargado, validar({query: ListarQuerySchema}), async(req, res) => {
    const { productoId, envaseId } = req.query as z.infer<typeof ListarQuerySchema>;
    res.json(await listarVariantes({
        ...(productoId !== undefined && { productoId }),
        ...(envaseId !== undefined && { envaseId })
    }))
});

varianteRouter.get('/:id', adminOEncargado, validar({params: IdParamSchema}), async(req, res) => {
    res.json(await obtenerVariante(Number(req.params.id)))
});

varianteRouter.post('/', soloAdmin, validar({body: VarianteInputSchema}), async(req, res) => {
    res.status(201).json(await crearVariante(req.usuarioId!, req.body))
});

varianteRouter.patch('/:id', adminOEncargado, validar({params: IdParamSchema, body: VarianteUpdateSchema}), async(req, res) => {
    res.json(await actualizarVariante(req.usuarioId!, Number(req.params.id), req.body))
});

varianteRouter.post('/:id/baja', soloAdmin, validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoVariante(req.usuarioId!, Number(req.params.id), false))
});
varianteRouter.post('/:id/alta', soloAdmin, validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoVariante(req.usuarioId!, Number(req.params.id), true))
});
