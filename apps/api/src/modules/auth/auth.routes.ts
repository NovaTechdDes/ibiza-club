import { Router } from "express";
import { LoginInputSchema } from "@ibiza/shared";
import { validar } from "../../middleware/validar.js";
import { loginAdmin } from "./auth.service.js";
import { requerirCaja } from "../../middleware/requerir-caja.js";
import { requerirAdmin } from "../../middleware/requerir-admin.js";

export const authRouter: Router = Router();

authRouter.post('/login', validar({ body: LoginInputSchema }), async (req, res) => {
    const { usuarioId, pin } = req.body;
    res.json(await loginAdmin(usuarioId, pin));
});


authRouter.get('/yo', requerirAdmin, async (req, res) => {
    res.json({usuarioId: req.usuarioId} )
})

// TEMPORAL: se reemplaza en los pasos 11 y 12
authRouter.get('/caja/yo', requerirCaja, async (req, res) => {
    res.json({ cajaId: req.cajaId })
});
