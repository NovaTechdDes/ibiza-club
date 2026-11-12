import type{ Rol } from "@ibiza/shared";
import { AppError } from "../errors/app-error.js";
import type{ NextFunction, Request, Response } from "express";
import { verificarToken } from "../utils/jwt.js";
import { prisma } from "../db/prisma.js";

declare global {
    namespace Express {
        interface Request {
            usuarioId?: number;
            rol?: Rol;
        }
    }
}

const ROLES_PANEL: readonly Rol[] = ["ADMIN", "ENCARGADO"];

const noAutorizado = () => new AppError(401, "NO_AUTORIZADO", "No autorizado");

export const autenticar = async (req: Request, _res: Response, next: NextFunction) => {
    const [esquema, token] = (req.headers.authorization ?? "").split(" ");
    if(esquema !== "Bearer" || !token) throw noAutorizado();

    let usuarioId: number;
    try{
        usuarioId = Number(verificarToken(token).sub)
    }catch {
        throw noAutorizado();
    }


    const usuario = await prisma.usuario.findUnique({
        where: {id: usuarioId},
        include: {accesoPanel: true}
    });
    const rol = usuario?.rol as Rol | undefined;
    if(!usuario || !usuario.activo || !usuario.accesoPanel || !rol || !ROLES_PANEL.includes(rol)){
        throw noAutorizado();
    }

    req.usuarioId = usuario.id;
    req.rol = rol;
    next();
}

export const permitir = (...roles: Rol[]) => (req: Request, _res: Response, next: NextFunction) => {
    if(!req.rol || !roles.includes(req.rol)){
        throw new AppError(403, "PROHIBIDO", "No tenés permiso para esta acción");
    }
    next();
};

export const soloAdmin = permitir('ADMIN');
export const adminOEncargado = permitir('ADMIN', 'ENCARGADO')