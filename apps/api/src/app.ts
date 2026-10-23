import { prisma } from "./db/prisma.js";
import express, { Express } from "express";

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
