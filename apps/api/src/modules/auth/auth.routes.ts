import { Router } from "express";
import { LoginInputSchema } from "@ibiza/shared";
import { validar } from "../../middleware/validar.js";
import { loginAdmin } from "./auth.service.js";

import { requerirAdmin } from "../../middleware/requerir-admin.js";
import { limiteLogin } from "../../middleware/rate-limit.js";

export const authRouter: Router = Router();

authRouter.post('/login',limiteLogin, validar({ body: LoginInputSchema }), async (req, res) => {
    const { usuarioId, pin } = req.body;
    res.json(await loginAdmin(usuarioId, pin));
});


authRouter.get('/yo', requerirAdmin, async (req, res) => {
    res.json({usuarioId: req.usuarioId} )
})
