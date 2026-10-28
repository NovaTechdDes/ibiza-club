import { prisma } from "./db/prisma.js";
import express, { Express } from "express";
import z from "zod";
import { CajaInputSchema, PromocionInputSchema } from "@ibiza/shared";

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

// Rutas temporales (6d): se reemplazan por el middleware de validación en el Paso 7.
app.post("/dev/validar-caja", (req, res) => {
    const resultado = CajaInputSchema.safeParse(req.body);
    if (!resultado.success) {
        res.status(400).json(z.flattenError(resultado.error));
        return;
    }
    res.json(resultado.data);
});

app.post("/dev/validar-promocion", (req, res) => {
    const resultado = PromocionInputSchema.safeParse(req.body);
    if (!resultado.success) {
        res.status(400).json(z.flattenError(resultado.error));
        return;
    }
    res.json(resultado.data);
});
