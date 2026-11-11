import jwt from 'jsonwebtoken';
import { env } from '../config/env.js'
import type { Rol } from '@ibiza/shared';
export type PayloadPanel = { sub: string; rol: Rol};

export const firmarToken = ( usuarioId: number, rol: Rol ): string => 
    jwt.sign({rol}, env.JWT_SECRET, { subject: String(usuarioId), expiresIn: env.JWT_EXPIRA_EN as jwt.SignOptions['expiresIn']})

export const verificarToken = (token: string): PayloadPanel => jwt.verify(token, env.JWT_SECRET) as PayloadPanel