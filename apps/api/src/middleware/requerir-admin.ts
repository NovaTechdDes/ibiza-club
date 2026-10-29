import { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { AppError } from "../errors/app-error.js";
import { verificarToken } from "../utils/jwt.js";

declare global {
    namespace Express {
        interface Request {
            usuarioId?: number;
        }
    }
}

const noAutorizado = () => new AppError(401, 'NO_AUTORIZADO', 'No autorizado');

export const requerirAdmin = async (req: Request, _res: Response, next: NextFunction) => {
    const [esquema, token] = (req.headers.authorization ?? '').split(' ');
    if (esquema !== 'Bearer' || !token) {
        throw noAutorizado();
    }

    let usuarioId: number;
    try {
        usuarioId = Number(verificarToken(token).sub);
    } catch {
        throw noAutorizado(); // token vencido o alterado
    }

    // Re-chequeo en la base: si se da de baja al admin, el token viejo deja de servir
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario || !usuario.activo || usuario.rol !== 'ADMIN') {
        throw noAutorizado();
    }

    req.usuarioId = usuario.id;
    next();
};
