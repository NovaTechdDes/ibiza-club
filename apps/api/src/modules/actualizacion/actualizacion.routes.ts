import { Router } from "express";
import z from "zod";
import { validar } from "../../middleware/validar.js";
import { obtenerUltimaVersion, obtenerUrlDescarga } from "./actualizacion.service.js";


const Version = z.string().regex(/^\d+\.\d+\.\d+$/);

export const actualizacionRouter: Router = Router();

actualizacionRouter.get('/', validar({ query: z.object({version: Version})}), async (req, res) => {
    const ultima = await obtenerUltimaVersion();
    if(!ultima || ultima.version === req.query.version){
        res.status(204).end();
        return
    }

    res.json({
        version: ultima.version,
        notes: ultima.notas,
        pub_date: ultima.publicadaEn,
        signature: ultima.firma,
        url: `${req.protocol}://${req.get("host")}${req.baseUrl}/descarga/${ultima.version  }`
    });
});

actualizacionRouter.get('/descarga/:version', validar({params: z.object({version: Version})}), async (req, res) => {
    res.redirect(302, await obtenerUrlDescarga(req.params.version as string))
})
