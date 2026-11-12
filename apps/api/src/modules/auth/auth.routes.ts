import { Router } from "express";
import { LoginInputSchema } from "@ibiza/shared";
import { validar } from "../../middleware/validar.js";
import {  loginPanel, obtenerYo } from "./auth.service.js";

import { limiteLogin } from "../../middleware/rate-limit.js";
import { autenticar } from "../../middleware/autenticar.js";
import { AppError } from "../../errors/app-error.js";

export const authRouter: Router = Router();

authRouter.post('/login',limiteLogin, validar({ body: LoginInputSchema }), async (req, res) => {
    const { email, password } = req.body;
    res.json(await loginPanel(email, password));
});


authRouter.get('/yo', autenticar, async (req, res) => {
    res.json(await obtenerYo(req.usuarioId!))
})
