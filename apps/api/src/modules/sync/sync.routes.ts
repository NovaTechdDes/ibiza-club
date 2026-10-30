import { Router } from "express";
import { validar } from "../../middleware/validar.js";
import { SyncBajadaSchema } from "@ibiza/shared";
import { obtenerCambios } from "./sync.service.js";

export const syncRouter: Router = Router();

syncRouter.get('/bajada', validar({query: SyncBajadaSchema}), async(req, res) => {
    res.json(await obtenerCambios(req.cajaId!, Number(req.query.desde)))
})