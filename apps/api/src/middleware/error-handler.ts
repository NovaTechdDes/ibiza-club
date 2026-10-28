import z, { ZodError } from "zod"
import { AppError } from "../errors/app-error.js"
import { NextFunction, Request, Response } from "express"

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if(err instanceof AppError){
        return res.status(err.status).json({
            error: {
                codigo: err.codigo,
                mensaje: err.message,
                detalle: err.detalle
            }
        })
    }

    if(err instanceof ZodError) {
        return res.status(400).json({
            error: {
                codigo: 'VALIDACION',
                detalle: z.flattenError(err),
                mensaje: "Datos inválidos"
            }
        })
    }

    // Errores del cliente que Express/body-parser genera solos (ej: JSON mal formado).
    if (typeof err === "object" && err !== null && "status" in err
        && typeof err.status === "number" && err.status >= 400 && err.status < 500) {
        return res.status(err.status).json({
            error: {
                codigo: 'VALIDACION',
                mensaje: "Solicitud inválida"
            }
        })
    }

    console.error(err);

    res.status(500).json({
        error: {
            codigo: 'INTERNO',
            mensaje: 'Error interno del servidor'
        }
    })
}