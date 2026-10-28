import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod"

type Esquemas = {
    body?: ZodType;
    params?: ZodType;
    query?: ZodType;
}

export const validar = (esquemas: Esquemas) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        if(esquemas.body){
            req.body = esquemas.body.parse(req.body);
        }
        if(esquemas.params){
            req.params = esquemas.params.parse(req.params) as typeof req.params
        }
        if(esquemas.query){
            Object.defineProperty(req, 'query', {
                value: esquemas.query.parse(req.query),
                writable: true,
                configurable: true
            })
        }
        next()
    }
};