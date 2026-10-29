import jwt from 'jsonwebtoken';
import { env } from '../config/env.js'
export type PayloadAdmin = { sub: string; rol: 'ADMIN'};

export const firmarToken = ( usuarioId: number ): string => 
    jwt.sign({rol: 'ADMIN'}, env.JWT_SECRET, { subject: String(usuarioId), expiresIn: env.JWT_EXPIRA_EN as jwt.SignOptions['expiresIn']})

export const verificarToken = (token: string): PayloadAdmin => jwt.verify(token, env.JWT_SECRET) as PayloadAdmin