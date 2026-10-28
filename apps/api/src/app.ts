import { prisma } from "./db/prisma.js";
import express, { Express } from "express";
import { CajaInputSchema, PromocionInputSchema } from "@ibiza/shared";
import { rutaNoEncontrada } from "./middleware/no-encontrado.js";
import { errorHandler } from "./middleware/error-handler.js";
import { validar } from "./middleware/validar.js";
import { apiRouter } from "./routes.js";

export const app: Express = express();

app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ ok: true })
});


app.get("/health/db", async (req, res) => {
    try {
        const cajas = await prisma.caja.count();
        res.json({ ok: true, cajas });
    } catch (error) {
        console.error(error);
        res.status(503).json({ ok: false });
    }
});


app.post("/dev/validar-caja",validar({ body: CajaInputSchema}), (req, res) => {
    res.json(req.body);
});

app.post("/dev/validar-promocion",validar({ body: PromocionInputSchema}), (req, res) => {
    res.json(req.body);
});

app.use('/api', apiRouter)

app.use(rutaNoEncontrada);
app.use(errorHandler);
