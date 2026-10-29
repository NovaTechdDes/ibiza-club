import { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { AppError } from "../errors/app-error.js";
import { hashearToken } from "../utils/token-dispositivo.js";

declare global {
    namespace Express {
        interface Request {
            cajaId?: number;
        }
    }
}

const noAutorizado = () => new AppError(401, 'NO_AUTORIZADO', 'No autorizado');

export const requerirCaja = async (req: Request, _res: Response, next: NextFunction) => {
    const [esquema, token] = (req.headers.authorization ?? '').split(' ');
    if (esquema !== 'Bearer' || !token) {
        throw noAutorizado();
    }

    const caja = await prisma.caja.findFirst({ where: { tokenHash: hashearToken(token) } });
    if (!caja || !caja.activo) {
        throw noAutorizado();
    }

    req.cajaId = caja.id;
    next();
};
