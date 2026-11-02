import { prisma } from "./db/prisma.js";
import express, { Express } from "express";
import helmet from "helmet";
import { rutaNoEncontrada } from "./middleware/no-encontrado.js";
import { errorHandler } from "./middleware/error-handler.js";
import { apiRouter } from "./routes.js";
import { corsMiddleware } from "./middleware/cors.js";
import { limiteGeneral } from "./middleware/rate-limit.js";
import { env } from "./config/env.js";

export const app: Express = express();

// Solo detrás del proxy de Azure: sin proxy, cualquiera podría falsificar su IP con X-Forwarded-For.
if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

app.use(helmet());
// Antes que express.json y las rutas: si no, un JSON mal formado responde sin headers de CORS
// y el navegador oculta el error; y el preflight tiene que contestarse sin pasar por la autenticación.
app.use(corsMiddleware);
// Solo sobre /api para dejar libre /health, y antes de express.json para no leer el body de lo que se rechaza.
app.use("/api", limiteGeneral);
// Un lote de 50 ventas grandes supera los 100 KB que acepta por defecto.
app.use(express.json({ limit: "1mb" }));

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
