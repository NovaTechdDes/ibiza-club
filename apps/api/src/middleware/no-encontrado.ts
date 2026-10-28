import { NextFunction, Request, Response } from "express"
import { AppError } from "../errors/app-error.js"

export const rutaNoEncontrada = (req: Request, res: Response, next: NextFunction) => {
    next(AppError.noEncontrado('Ruta no encontrada'))
}