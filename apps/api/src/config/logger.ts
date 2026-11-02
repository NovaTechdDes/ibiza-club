import { pino } from "pino";
import { env } from "./env.js";

export const logger = pino({
    level: env.LOG_LEVEL,
    // Segunda barrera: si alguna vez se pasa uno de estos campos a un log, sale oculto
    redact: {
        paths: [
            "pin", "*.pin",
            "pinHash", "*.pinHash",
            "token", "*.token",
            "tokenHash", "*.tokenHash",
            "password", "*.password",
            "authorization", "*.authorization"
        ],
        censor: "[oculto]"
    },
    // pino-pretty es solo de desarrollo: en producción se escribe JSON
    ...(env.NODE_ENV === "development" ? { transport: { target: "pino-pretty" } } : {})
});
