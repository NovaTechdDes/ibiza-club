import cors from 'cors';
import { env } from '../config/env.js'

export const corsMiddleware = cors({
    origin: env.CORS_ORIGENES,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600
})