import { PrismaMssql } from "@prisma/adapter-mssql";
import { env } from "../config/env.js";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaMssql({
    server: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    options: { encrypt: true, trustServerCertificate: true }
});

export const prisma = new PrismaClient({ adapter });
