export type CodigoError = | 'VALIDACION' | 'NO_ENCONTRADO' | 'NO_AUTORIZADO' | 'CONFLICTO' | 'INTERNO' | 'PROHIBIDO';

export class AppError extends Error {
    constructor(public readonly status: number, public readonly codigo: CodigoError, mensaje: string, public readonly detalle?: unknown){
        super(mensaje);
        this.name = "AppError";
    }

    static noEncontrado(mensaje = "Recurso no encontrado"){
        return new AppError(404, "NO_ENCONTRADO", mensaje);
    }

    static conflicto(mensaje: string){
        return new AppError(409, "CONFLICTO", mensaje)
    }
}