import { prisma } from "./db/prisma.js";
import express, { Express } from "express";
import helmet from "helmet";
import { rutaNoEncontrada } from "./middleware/no-encontrado.js";
import { errorHandler } from "./middleware/error-handler.js";
import { apiRouter } from "./routes.js";
import { corsMiddleware } from "./middleware/cors.js";

export const app: Express = express();

app.use(helmet());
// Antes que express.json y las rutas: si no, un JSON mal formado responde sin headers de CORS
// y el navegador oculta el error; y el preflight tiene que contestarse sin pasar por la autenticación.
app.use(corsMiddleware);
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

app.use('/api', apiRouter)

app.use(rutaNoEncontrada);
app.use(errorHandler);
