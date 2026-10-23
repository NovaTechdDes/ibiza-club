# Sistema Ibiza Club

Monorepo pnpm: `apps/api` (backend), `apps/caja`, `apps/panel`, `packages/shared`.

## Requisitos en la PC nueva

- Git
- Node.js 24 o superior
- pnpm 12 (`corepack enable` o `npm i -g pnpm`)
- SQL Server local con TCP/IP habilitado (puerto 1433) y autenticación SQL (SSMS opcional)

## Instalar y levantar

```powershell
git clone <URL-DEL-REPO> ibiza
cd ibiza
pnpm install
copy apps\api\.env.template apps\api\.env
```

Editar `apps/api/.env` con el usuario y la contraseña de SQL Server de esa PC (`DB_USER`, `DB_PASSWORD`).

## Base de datos

No hace falta crear la base a mano: Prisma crea `ibiza_dev` si no existe.

```powershell
cd apps\api
pnpm prisma migrate deploy   # aplica las migraciones existentes
pnpm prisma generate         # genera el cliente en src/generated (no se versiona)
```

Usar `migrate deploy` en la PC nueva. `migrate dev` es solo para crear migraciones nuevas al cambiar `schema.prisma`.

## Correr la API

```powershell
pnpm --filter @ibiza/api dev
```

Verificar: `http://localhost:3000/health` y `http://localhost:3000/health/db`.

## Notas

- Después de cada `git pull` con cambios en `prisma/`: `pnpm prisma migrate deploy` y `pnpm prisma generate`.
- Si la conexión falla, revisar que SQL Server tenga TCP/IP activo y que el login del `.env` exista.
- Nunca subir `.env` a git.
