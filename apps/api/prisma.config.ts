import "dotenv/config";
import { defineConfig } from "prisma/config";

const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: `sqlserver://${DB_HOST}:${DB_PORT};database=${DB_NAME};user=${DB_USER};password=${DB_PASSWORD};encrypt=true;trustServerCertificate=true`,
  },
});