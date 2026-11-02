import { Request } from "express";
import {ipKeyGenerator, rateLimit} from 'express-rate-limit';
import { AppError } from "../errors/app-error.js";

const MINUTO = 60 * 1000;

// Algunos porixes mandan "ip:puerto" y el puerto cambia en cada conexion
// si queda en la clave, cada conexion cuneta como un cliente nuevo y el limite no frena a nadie
const claveCliente = (req: Request) => {
     const ip = (req.ip ?? '')
     .replace(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/, "$1")
     .replace(/^\[(.+)\]:\d+$/, "$1");
    return ipKeyGenerator(ip)
}

const crearLimite = (windowMs: number, limit: number, mensaje: string, skipSuccessfulRequests = false) => 
    rateLimit({
        windowMs,
        limit,
        skipSuccessfulRequests,
        standardHeaders: "draft-8", legacyHeaders: false,
        keyGenerator: claveCliente,
        handler: (_req, _res, next) => next(new AppError(429, "DEMASIADOS_INTENTOS", mensaje))
    });

export const limiteGeneral = crearLimite(MINUTO, 1000, "demasiadas solicitudes, proba en un momento")
export const limiteLogin = crearLimite(15 * MINUTO, 10, "Demasiados intentos fallidos, proba en 15 minutos", true)
