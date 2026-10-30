import { Router } from "express";
import { validar } from "../../middleware/validar.js";
import { SyncBajadaSchema, SyncSubidaSchema } from "@ibiza/shared";
import { obtenerCambios } from "./sync.service.js";
import { procesarSubida } from "./subida.service.js";

export const syncRouter: Router = Router();

syncRouter.get('/bajada', validar({query: SyncBajadaSchema}), async(req, res) => {
    res.json(await obtenerCambios(req.cajaId!, Number(req.query.desde)))
})

// Siempre 200 aunque haya una rechazada: la caja borra de su cola las confirmadas y reintenta el resto
syncRouter.post('/subida', validar({body: SyncSubidaSchema}), async(req, res) => {
    res.json(await procesarSubida(req.cajaId!, req.body.operaciones))
})
