import { Router } from "express";
import { CambiarPasswordSchema, LoginInputSchema } from "@ibiza/shared";
import { validar } from "../../middleware/validar.js";
import { cambiarPassword, loginPanel, obtenerYo } from "./auth.service.js";

import { limiteLogin } from "../../middleware/rate-limit.js";
import { autenticar } from "../../middleware/autenticar.js";

export const authRouter: Router = Router();

authRouter.post('/login',limiteLogin, validar({ body: LoginInputSchema }), async (req, res) => {
    const { email, password } = req.body;
    res.json(await loginPanel(email, password));
});


authRouter.get('/yo', autenticar, async (req, res) => {
    res.json(await obtenerYo(req.usuarioId!))
})

// limiteLogin: frena a quien pruebe contraseñas actuales con un token robado.
authRouter.put('/password', limiteLogin, autenticar, validar({ body: CambiarPasswordSchema }), async (req, res) => {
    await cambiarPassword(req.usuarioId!, req.body.actual, req.body.nueva);
    res.status(204).end();
})
