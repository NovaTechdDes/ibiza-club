import { Router } from "express";
import { validar } from "../../middleware/validar.js";
import { SyncBajadaSchema, SyncSubidaSchema } from "@ibiza/shared";
import { obtenerCambios } from "./sync.service.js";
import { procesarSubida } from "./subida.service.js";
import { registrarContacto } from "./estado-sync.service.js";

export const syncRouter: Router = Router();

syncRouter.get('/bajada', validar({query: SyncBajadaSchema}), async(req, res) => {
    const desde = Number(req.query.desde);
    // Va antes de obtenerCambios: una caja con conflicto de versión igual se conectó, y "desde" es la versión que dice tener
    await registrarContacto(req.cajaId!, { versionCatalogo: desde });
    res.json(await obtenerCambios(req.cajaId!, desde));
})

// Siempre 200 aunque haya una rechazada: la caja borra de su cola las confirmadas y reintenta el resto
syncRouter.post('/subida', validar({body: SyncSubidaSchema}), async(req, res) => {
    const resultado = await procesarSubida(req.cajaId!, req.body.operaciones);
    // ultimaSubidaEn solo avanza si entró algo: un lote rechazado entero cuenta como contacto, no como subida
    await registrarContacto(req.cajaId!, resultado.confirmadas.length > 0 ? { ultimaSubidaEn: new Date() } : {});
    res.json(resultado);
})
