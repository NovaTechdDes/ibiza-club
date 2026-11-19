import z from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    PORT: z.coerce.number().default(3000),
    DB_PORT: z.coerce.number().default(1433),
    DB_HOST: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRA_EN: z.string().default("8h"),
    CORS_ORIGENES: z.string().transform((val) => val.split(',').map((origen) => origen.trim())).pipe(z.array(z.url()).min(1)),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
    CLAVE_LETRA: z.string().min(32),
    JORNADA_ACTIVA: z.stringbool().default(true),
    AZURE_STORAGE_CONNECTION_STRING: z.string().min(3),
    AZURE_STORAGE_CONTENEDOR: z.string().min(3),
    GITHUB_TOKEN: z.string().min(1),
    GITHUB_REPO: z.string().regex(/^[\w.-]+\/[\w.-]+$/).default("NovaTechdDes/ibiza-club")
});

export const env = envSchema.parse(process.env);