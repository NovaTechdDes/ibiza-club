import { Request } from "express";
import { pinoHttp } from "pino-http";
import { logger } from "../config/logger.js";

export const logHttp = pinoHttp({
    logger,
    // Azure consulta /health seguido: loguearlo solo taparía lo importante
    autoLogging: { ignore: (req) => req.url?.startsWith("/health") ?? false },
    // Solo estos campos: por defecto se loguearían todos los headers, incluido Authorization
    serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res) => ({ status: res.statusCode })
    },
    // Quién hizo el pedido: permite filtrar por caja o por usuario
    customProps: (req) => ({
        cajaId: (req as Request).cajaId,
        usuarioId: (req as Request).usuarioId
    }),
    customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
    }
});
