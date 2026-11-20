# CLAUDE.md — Sistema Ibiza Club

Contexto del proyecto para retomar en cualquier chat. Si sos Claude y leés esto: el usuario va a escribir "seguimos con el paso X". Ubicá el paso en la hoja de ruta (al final) y continuá desde ahí.

## Cómo trabajamos

- Todo en **español**.
- **Paso a paso**: un paso por vez, explicado, y esperar a que el usuario diga que lo terminó antes de seguir.
- **El usuario escribe el código.** Se le dan instrucciones, comandos y fragmentos cortos con explicación de por qué. No generar proyectos enteros de una.
- Cada paso termina con una sección **"Para verificar"** (cómo comprobar que funcionó).
- Orden acordado: **primero el backend** (API en Azure). La app de escritorio y el panel web van después.
- Ante dudas que cambian el diseño, preguntar antes de avanzar.

## Qué es

Sistema de escritorio de venta de bebidas para **Ibiza Club**, un boliche que abre **viernes y sábados de noche**. Son **5 o 6 cajas**, todas iguales y todas venden bebidas. Tienen nombre (ej: "Caja VIP", "Caja 1").

## Decisiones de arquitectura

- **Offline-first**: cada caja tiene su **propia base local (SQLite)** y vende sola toda la noche, sin internet y sin depender de otra PC.
- **Azure es la central** (fuente de verdad de configuración, destino de las ventas, reportes). No se usa en vivo para vender.
- **Sincronización oportunista** por internet y, como respaldo, por la **red local** entre cajas (el router sigue funcionando sin internet).
- Las ventas locales se pueden **borrar de la caja solo cuando Azure confirmó** que las recibió, con unos días de margen.
- **Reportes 100% online** (panel web del dueño).
- Recomendado: UPS para router y PCs.

## Ticket

- **Un ticket por compra**, con una línea por producto para que el preparador tache lo que entrega.
- Validación **visual** en la barra (sin QR por ahora). El preparador mira la letra y la fecha, prepara y tacha.
- Contenido: **letra de la semana** (grande), **fecha de la jornada** (ej: "VIE 23/10"), **caja**, **correlativo por caja** (ej: "C2-0147"), ítems, línea de promo con descuento, total, medio de pago y hora.
- **Letra de la semana**: no sigue un orden predecible y se puede repetir algún fin de semana. **Cada caja la calcula sola** a partir de la fecha y una clave secreta (todas llegan al mismo resultado sin comunicarse).
- Anti-fotocopia: rollos térmicos con logo preimpreso o color que cambia (físico, no software).
- QR con firma digital: descartado por ahora, posible a futuro.

Ejemplo:

```
        ★  S  ★
   VIE 23/10 · Caja 2 · #0147
 2 x Vodka c/ speed (vaso)  $8.000
     Promo 2x1             -$4.000
 1 x Fernet (tanque)        $6.000
 TOTAL                     $10.000
 Pago: Mercado Pago      23:47 hs
```

## Jornada

Una noche cruza la medianoche: las 3:00 del sábado pertenecen a la **jornada del viernes**. Se define un horario de corte (ej: 18:00 a 10:00). Afecta a promos, fecha del ticket y letra. Los relojes de las cajas tienen que estar sincronizados.

## Pagos

Efectivo, Mercado Pago (QR) y transferencia. **Sin integración por ahora**: el cajero verifica en su celular y elige el medio. Cada venta registra su medio de pago. Integración con Mercado Pago: posible a futuro (pendiente de consultar al cliente).

## Catálogo

- **Categoría** (tragos, cervezas, sin alcohol, shots, botellas).
- **Producto** (ej: "Vodka con speed").
- **Envase**: lista configurable (por ahora vaso y tanque).
- **Variante** = producto + envase, con **su propio precio**. Si no existe la variante, no se vende en ese envase.
- **Promociones**:
  - Tipos: NxM (2x1, 3x2), descuento en porcentaje, descuento en monto fijo.
  - Alcance: uno o varios productos, o una categoría, más los envases permitidos (uno o ambos).
  - Vigencia: días (viernes, sábado o ambos) y horario (toda la noche o hasta cierta hora).
  - Activa o pausada.
  - **Se aplican solas**: el cajero no elige nada.
  - **2x1 solo con bebidas iguales y del mismo envase**, contado de a pares (3 pagan 2, 4 pagan 2, 5 pagan 3).
  - **No se acumulan**: si aplican dos, gana la más conveniente para el cliente.
  - En el ticket salen las bebidas reales y la promo como línea de descuento.

## Usuarios y permisos

| Permiso                | Cajero | Encargado | Admin/Dueño |
| ---------------------- | ------ | --------- | ----------- |
| Vender                 | ✓      | ✓         | ✓           |
| Anular venta           | —      | ✓         | ✓           |
| Retirar efectivo       | —      | ✓         | ✓           |
| Cambiar precios        | —      | ✓         | ✓           |
| Crear/pausar promos    | —      | ✓         | ✓           |
| Crear usuarios y cajas | —      | —         | ✓           |
| Ver reportes           | —      | —         | ✓ (online)  |

- El cajero entra con su **PIN**. Para acciones sensibles, el encargado pone **su PIN solo para esa acción**.
- Usuarios y PINs (hasheados) se cargan en Azure y bajan a todas las cajas.
- Todo lo sensible queda en **auditoría** (quién, qué, cuándo, desde qué caja).

## Caja (sin turnos formales)

- **Apertura**: cajero con PIN + **fondo de cambio** cargado por el encargado.
- **Durante la noche**: ventas, **retiros de efectivo** (monto, motivo, PIN de encargado, comprobante impreso), **cambio de cajero** con PIN (en principio 1 cajero por caja, pero pueden rotar) con conteo parcial opcional.
- **Cierre con arqueo ciego**: se cuenta la plata sin ver el esperado; después el sistema muestra la diferencia. Muestra también totales de Mercado Pago y transferencia. Se imprime resumen y se sube a Azure.
- **Anulación**: requiere recuperar el ticket físico, PIN de encargado y motivo.
- Si se corta la luz, la caja recupera la jornada abierta. Si quedó abierta, el encargado la cierra pendiente.

## Pantalla de venta (diseño existente, ajustes acordados)

Tema oscuro, categorías arriba con contador, grilla de tarjetas, carrito a la derecha, total grande y botón COBRAR. Ajustes a hacer:

1. Tarjeta con **dos botones (Vaso $X / Tanque $Y)** para agregar en un toque.
2. **Cartel de promo** en la tarjeta ("2x1 hasta 02:00") y línea de descuento en el carrito.
3. Encabezado: **caja + cajero**, letra de la semana e indicador de sincronización.
4. Carrito menos apretado.
5. "Vaciar" alejado de COBRAR o con confirmación.
6. Que entre todo sin scroll.
7. Íconos más distinguibles.
8. Menú lateral con PIN de encargado y sección Promos.

Pendiente: **pantalla de cobro** (botones Efectivo/MP/Transferencia, "paga con" con montos rápidos y vuelto, confirmación de pago digital).

## Stack

**Nube (Azure)**: Node.js + Express 5 + TypeScript, Zod, Prisma 7 con `@prisma/adapter-mssql`, Azure SQL (plan serverless), Azure App Service, Application Insights.

**Cajas**: Electron + React + Vite, SQLite local, impresión térmica ESC/POS 80 mm (probar impresora real temprano), electron-updater. Prisma en SQLite requiere un schema aparte y probar el empaquetado; alternativa Drizzle.

**Monorepo**: pnpm workspaces, ESM (`"type": "module"`), `module/moduleResolution: NodeNext` (imports relativos con extensión `.js`).

```
ibiza/
├── apps/
│   ├── api/       → backend Azure
│   ├── caja/      → app de escritorio (después)
│   └── panel/     → web del dueño (después)
├── packages/
│   └── shared/    → schemas Zod, tipos y lógica de promos compartida
├── tsconfig.base.json
├── pnpm-workspace.yaml
└── CLAUDE.md
```

Desarrollo: SQL Server instalado local en Windows (con SSMS, **sin Docker**), base `ibiza_dev`.

## Decisiones de datos

- **IDs `Int` autoincrement** en la nube. Las operaciones que nacen en una caja (apertura, venta, cierre, movimiento, anulación, auditoría) llevan además `idLocal` (el id autoincrement de la SQLite de la caja); el par `cajaId + idLocal` es único y evita choques entre cajas offline.
- **Plata como enteros en pesos**, nunca decimales flotantes.
- **Versión global** que sube con cada cambio de configuración; cada fila de configuración guarda en qué versión cambió.
- **Bajas lógicas** (`activo = false`), nunca borrar configuración.
- **Snapshots en ventas**: el ítem guarda nombre y precio al vender.
- Las operaciones **solo se agregan**, no se editan (una anulación es un registro nuevo).

## Modelos

**Configuración (nube → cajas)**: Caja (nombre, token de dispositivo, activa), Usuario (nombre, rol, PIN hasheado, activo), Categoría, Producto, Envase, Variante (producto + envase + precio), Promoción (tipo, valores, días, horario, activa), Alcance de promo (producto o categoría + envases).

**Operación (caja → nube)**: Jornada (fecha operativa, letra), Apertura de caja (caja, jornada, fondo, apertura, cierre, contado, esperado, diferencia, estado), Venta (apertura, correlativo, cajero, medio de pago, subtotal, descuento, total, estado, anulación), Ítem de venta (variante, nombre y precio copiados, cantidad, promo, descuento), Movimiento de caja (fondo, retiro, conteo parcial; monto, motivo, quién autorizó), Auditoría. Solo local: Cola de sincronización.

## Protocolo de sincronización

1. **Catálogo baja**: la caja pregunta "¿qué cambió desde la versión X?" cada 1-2 minutos; la nube responde solo los cambios; la caja aplica todo en una transacción.
2. **Operaciones suben** (bandeja de salida): la venta y su entrada en la cola se guardan en la misma transacción; se mandan lotes de ~50; la nube inserta solo si el par `cajaId + idLocal` no existe (idempotente) y confirma; reintentos con espera creciente. Orden: apertura → ventas y movimientos → cierre.
3. **Cambio de precio desde una caja**: se aplica local, sube por la cola, la nube genera nueva versión y baja a todas. Conflicto: gana el más reciente por hora, ambos auditados.
4. **Red local** (respaldo sin internet): las cajas se descubren por mDNS, se avisan cambios de precio y una caja que prende pide el catálogo más nuevo a sus compañeras. Las ventas no viajan por la red local. Al volver internet, la nube tiene la última palabra.

- No se sincronizan: correlativo (propio de cada caja) ni letra (calculada).
- Cada caja tiene su **token** para la API, revocable desde la nube.
- La caja avisa si su hora difiere mucho de la nube.
- Indicador en pantalla: "Sincronizado" / "N ventas pendientes" / "Sin internet".

## Hoja de ruta del backend

- [x] **Paso 1** — Esqueleto del monorepo (pnpm, carpetas, `pnpm-workspace.yaml`, Git).
- [x] **Paso 2** — `tsconfig.base.json` compartido (ES2022, NodeNext, strict, noUncheckedIndexedAccess).
- [x] **Paso 3** — `apps/api` con Express 5, `tsx`, `--env-file`, variables validadas con Zod (`src/config/env.ts`), `app.ts` + `index.ts`, ruta `/health`.
- [x] **Paso 4** — Prisma 7 + SQL Server local: preparar SQL Server (TCP/IP, autenticación SQL, login y base), `prisma.config.ts`, cliente con adapter en `src/db/prisma.ts`, primer modelo `Caja`, primera migración, ruta `/health/db`.
- [x] **Paso 5** — Schema completo de Prisma con todos los modelos, relaciones, índices y versión global.
- [x] **Paso 6** — Paquete `packages/shared`: enums, constantes, schemas Zod y tipos compartidos; usarlo desde la API.
- [x] **Paso 7** — Estructura de módulos (`src/modules/`), middleware de validación con Zod y manejo central de errores.
- [x] **Paso 8** — Seed de datos de prueba (cajas, usuarios, catálogo, promos).
- [x] **Paso 9** — Módulo catálogo: CRUD de categorías, productos, envases, variantes y promos (sube la versión global y registra auditoría).
- [x] **Paso 10** — Autenticación: login del panel (admin, JWT) y token de dispositivo por caja.
- [x] **Paso 11** — Endpoint de sincronización de bajada (cambios desde versión X).
- [x] **Paso 12** — Endpoint de sincronización de subida (lotes idempotentes de operaciones, orden de dependencias).
- [x] **Paso 13** — Lógica de promos y letra de la semana en `shared`, con tests (Vitest).
- [x] **Paso 14** — Endpoints de reportes (ventas por jornada, caja, medio de pago, promos, arqueos, estado de sincronización por caja).
- [x] **Paso 15** — Seguridad y operación: CORS, helmet, rate limit, logs estructurados.
- [x] **Paso 16** — Deploy en Azure: App Service, Azure SQL serverless, variables de entorno, migraciones en producción, con GitHub Actions (`.github/workflows/deploy-api.yml`).

## Hoja de ruta del frontend

Para retomar: "seguimos con el paso F3". Cada paso que toca backend lo dice en el título.

### Bloque A: caja que vende sin internet

- [x] **F1** — Crear `apps/caja` con Tauri + React + TypeScript dentro del monorepo, usando `@ibiza/shared`.
- [x] **F2** — Base del frontend: crear `packages/ui`, tema oscuro táctil y componentes base; sumar Zustand, TanStack Query, Axios y SweetAlert; pantalla principal vacía y ventana con el tamaño de trabajo.
- [x] **F3** — SQLite local con `tauri-plugin-sql`: tablas de catálogo, operaciones y cola, y migraciones.
- [x] **F4** — Vincular la PC con su caja: cargar y guardar el token de dispositivo y la URL de la API; sumar los orígenes de Tauri a `CORS_ORIGENES` (`http://localhost:1420` y `http://tauri.localhost`).
- [x] **F5** — Sincronización de bajada: pedir cambios desde la versión guardada, aplicarlos en una transacción y manejar el conflicto de versión (borrar y pedir desde 0).
- [x] **F6** — Ingreso del cajero con PIN y teclado en pantalla, validando contra el `pinHash` local sin internet.
- [x] **F7** — Apertura de caja y jornada (incluye backend): fondo de cambio con PIN de encargado, modo jornada configurable, fecha operativa y letra. Definir cómo llega la clave de la letra a las cajas.
- [x] **F8** — Pantalla de venta: productos con sus variantes a la izquierda, carrito a la derecha y promos con la lógica de `shared`.
- [x] **F9** — Cobro en un toque: Efectivo, Transferencia y Tarjeta; correlativo; la venta y su entrada en la cola se guardan en la misma transacción.
- [x] **F10** — Impresión del ticket ESC/POS de 80 mm desde Rust, probada en una impresora real.
- [x] **F11** — Sincronización de subida: lotes con reintentos y espera creciente, orden de dependencias, e indicador "Sincronizado / N pendientes / Sin internet".
- [x] **F12** — Operación durante la noche: retiros con comprobante, cambio de cajero, anulación y auditoría.
- [x] **F13** — Cierre con arqueo ciego y recuperación tras un corte de luz. Con esto la caja queda completa para vender.

### Bloque B: administración compartida

- [x] **F14** — Backend, login de administración: agregar email y contraseña a `Usuario`, login para Admin y Encargado, rol en el JWT y permisos por rol en cada ruta. Forma segura de crear el primer admin.
  - Decidido (11/11/2026): email y contraseña van en un modelo aparte **`AccesoPanel`** (1 a 1 con `Usuario`), no como columnas de `Usuario`, porque en SQL Server un `UNIQUE` admite un solo `NULL` y los cajeros no tienen email. `AccesoPanel` no baja a las cajas.
  - Sub-pasos: **F14a** schema y migración · **F14b** login con email y contraseña, rol en el JWT, seed · **F14c** permisos por rol en cada ruta · **F14d** crear el primer admin en producción.
- [x] **F15** — Backend, usuarios y cajas: CRUD de usuarios (sube la versión global y baja a las cajas) y alta y edición de cajas.
  - Rutas (todas solo Admin): `/cajas` (alta, edición, baja/alta, token) y `/usuarios` (alta, edición, baja/alta, `PUT /:id/pin`, `PUT` y `DELETE /:id/acceso`). Cada usuario cambia su contraseña con `PUT /auth/password`.
  - Reglas: un admin no puede darse de baja, cambiarse el rol ni quitarse el acceso a sí mismo; un Cajero no puede tener acceso al panel y, si un usuario pasa a Cajero, su acceso se borra. Contraseñas nuevas de 12 caracteres o más (`PasswordNuevaSchema`). El acceso al panel no sube la versión global.
- [x] **F16** — Base de administración en `packages/ui`: login, sesión, menú según el rol y aviso cuando no hay internet.
  - Todo vive en `packages/ui/src/admin/`. Las apps montan `<Administracion apiUrl onVolver? />` dentro de su `QueryClientProvider`.
  - Para sumar una pantalla (F17 a F20): escribir el componente y ponerlo en `componente` de su entrada en `secciones.ts`. Las pantallas piden la API con `useApiAdmin()` y muestran errores con `mensajeDeError()`.
  - Sesión en `sessionStorage` (aguanta un F5, muere al cerrar). Un 401 con sesión abierta la cierra sola. El aviso de sin internet sale de pegarle a `/health` cada 15 s, no de `navigator.onLine`.
  - En desarrollo se prueba con `pnpm --filter @ibiza/caja tauri dev`, desde el botón "Administración" de la pantalla de venta (F22). La vista previa con `#admin` en el navegador ya no existe.
- [x] **F17** — Pantallas de catálogo: categorías, productos, envases, variantes y precios.
- [x] **F18** — Pantalla de promociones.
- [x] **F19** — Pantallas de reportes: ventas por caja, medio de pago y promo, arqueos y estado de sincronización.
  - Todo en `packages/ui/src/admin/reportes/`: una pestaña por reporte en `Reportes.tsx`. Las que llevan rango usan `useReporte(ruta, rango)`; Sincronización no lleva rango y usa `useEstadoSync()`, que se refresca cada 30 s.
- [x] **F20** — Pantallas de usuarios y cajas, incluido generar y revocar el token de cada caja.
- [x] **F21** — Imágenes de productos (incluye backend): subida a Blob Storage, carga desde administración y caché local en las cajas para vender sin internet.
  - Sub-pasos: **F21a** campo `imagenUrl` en `Producto` (hecho) · **F21b** Blob Storage y endpoints `PUT`/`DELETE /productos/:id/imagen` (hecho) · **F21c** subir y quitar la imagen desde la pantalla de productos (hecho) · **F21d** caché local en la caja y mostrarla en la venta (hecho).
  - Caché (F21d): después de cada bajada, el comando Rust `cachear_imagenes` (`src-tauri/src/imagen.rs`, con `reqwest` + `native-tls`) baja a `$APPDATA/imagenes/` las que faltan y borra las que ya no usa ningún producto. El nombre del archivo es el del blob. La venta las muestra con el protocolo `asset` (`convertFileSrc`, scope solo esa carpeta) desde `src/lib/imagenes.ts`. La migración 4 agrega `Producto.imagenUrl` y vuelve `versionCatalogo` a 0.
  - Decidido (18/11/2026): contenedor con lectura pública (las fotos de bebidas no son sensibles y así la caja las descarga sin token). Un nombre de blob nuevo en cada subida, para que el cambio de URL invalide las cachés. Solo el Admin sube o quita imágenes.
- [x] **F22** — Integrar la administración al escritorio: acceso desde el menú lateral, login propio, cerrar sesión al volver a la venta y comprobar que un cambio llega a las cajas.
  - Sub-pasos: **F22a** botón "Administración" en el encabezado de la venta (no hay menú lateral), vista `"admin"` dentro de `PantallaVenta` para que la sincronización siga corriendo; al volver se borran las queries `["admin"]` y se fuerza la bajada (hecho) · **F22b** prueba de punta a punta.
- [x] **F23** — Crear `apps/panel` (React + Vite, sin Tauri ni SQLite) con las pantallas de `packages/ui`.
- [x] **F24** — Publicar el panel en Azure con GitHub Actions y poner su URL real en `CORS_ORIGENES`.
  - Azure **Static Web Apps** plan Free (`ibiza-panel`, grupo `NOVATECH-BR`, región eastus2), no App Service: el panel son archivos estáticos y así no ocupa `novatech-plan-br`. Se descartó Vercel porque su plan gratis no admite uso comercial. URL: `https://white-smoke-01682b30f.8.azurestaticapps.net`.
  - Workflow `.github/workflows/deploy-panel.yml`: compila `shared` y el panel (con `tsc`) y sube `apps/panel/dist` con `Azure/static-web-apps-deploy` (`skip_app_build`, secreto `AZURE_SWA_TOKEN`). Al final comprueba que el sitio responda con la cabecera CSP.
  - `VITE_API_URL` de producción va en `apps/panel/.env.production` (se graba en el JS al compilar; no es secreto). `apps/panel/public/staticwebapp.config.json` tiene el fallback a `index.html` y las cabeceras (CSP con la API y `*.blob.core.windows.net`). En `public/` nunca va configuración: se publica tal cual.
  - Dominio personalizado: pendiente de comprar. Va como subdominio (ej. `panel.<dominio>`) con un CNAME a la URL de arriba; Azure emite el certificado. Al agregarlo, sumarlo a `CORS_ORIGENES` y a `PANEL_URL` del workflow.

### Bloque C: instalación y actualizaciones

- [x] **F25** — Actualización automática con `tauri-plugin-updater` y GitHub Releases: firma, workflow por tag y modal que nunca interrumpe una venta.
  - Decidido (18/11/2026): los releases van en el **repo principal, privado**. Para no meter un token de GitHub dentro de la app, la caja no le pide la actualización a GitHub sino a **nuestra API** (con su token de dispositivo). La API lee el release con un token de GitHub de solo lectura que vive en el App Service y hace de intermediaria en la descarga.
  - Decidido (18/11/2026): **se actualiza solo con la caja cerrada**. Se descarga en segundo plano; durante la noche solo hay un aviso chico en el encabezado. Sin apertura abierta, el modal es obligatorio: instala y reinicia. Si no hay internet o falla la descarga, no bloquea.
  - Sub-pasos: **F25a** claves de firma, plugin y build firmado local (hecho) · **F25b** workflow por tag que publica el release (hecho, `caja-v0.1.0` publicado el 19/11/2026) · **F25c** backend, endpoint de actualizaciones y descarga (hecho, probado en local y en Azure el 19/11/2026) · **F25d** modal y aviso en la caja (hecho, probado en local el 19/11/2026) · **F25e** prueba de punta a punta (hecho, 20/11/2026).
  - F25a: la clave privada vive en `~/.tauri/ibiza-caja.key` (fuera del repo; `*.key` en `.gitignore` como red de seguridad). La pública está en `plugins.updater.pubkey` de `tauri.conf.json`; `capabilities/desktop.json` habilita `updater:default`.
  - F25b: `.github/workflows/release-caja.yml` corre en `windows-latest` con un tag `caja-v<versión>`, que tiene que coincidir con `apps/caja/package.json` (si no, falla antes de compilar). Firma con los secretos `TAURI_SIGNING_PRIVATE_KEY` y `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` y publica con `gh release create` dos archivos con nombre fijo: `ibiza-caja_<versión>_x64-setup.exe` y su `.sig`. No genera `latest.json`: la respuesta del updater la arma la API en F25c. Primer release: `caja-v0.1.0`. Las primeras corridas fallaron con `failed to decode secret key: incorrect updater private key password: failed to fill whole buffer` porque en el secreto `TAURI_SIGNING_PRIVATE_KEY` estaba la clave **pública** (`ibiza-caja.key.pub`, 152 caracteres) en vez de la privada (`ibiza-caja.key`, 348 caracteres). Se diagnosticó con un workflow temporal (`workflow_dispatch`) que medía el largo y el hash de los secretos y probaba `signer sign`; ya se borró. Para revisar un secreto sin verlo, ese truco sirve: comparar `printf '%s' "$SECRETO" | sha256sum` con el hash del archivo local.
  - F25c: módulo `apps/api/src/modules/actualizacion/`, montado en `/api/actualizaciones` con `requerirCaja` (token de dispositivo). Sigue el protocolo de servidor dinámico de Tauri:
    - `GET /api/actualizaciones?version=x.y.z` responde **204** si no hay nada nuevo (o es la misma versión), o **200** con `{ version, notes, pub_date, signature, url }`. La API no compara mayor/menor: si la caja tiene una versión más nueva, Tauri descarta la oferta solo. La `url` se arma con `req.protocol`, `host` y `req.baseUrl` (en Azure sale `https` por el `trust proxy`).
    - `GET /api/actualizaciones/descarga/:version` responde **302** a la URL firmada y temporal de GitHub del `.exe` (se pide con `redirect: "manual"`). El instalador no pasa por el App Service y el token de GitHub nunca sale de la API. Solo sirve la última versión; otra da 404.
    - El servicio busca el último release no draft ni prerelease con tag `caja-v*`, valida la respuesta con Zod, exige el `.exe` y el `.sig` con nombre fijo (si falta alguno, responde 204) y lee la firma. Caché en memoria de 5 minutos; si GitHub falla no se cachea y la API responde 502 con el status de GitHub.
    - Variables: `GITHUB_TOKEN` (obligatoria) y `GITHUB_REPO` (default `NovaTechdDes/ibiza-club`, con regex). El token es fine-grained ("Token Ibiza"): dueño NovaTechdDes, solo `ibiza-club`, **Contents: Read-only**, sin vencimiento (si venciera, las cajas dejan de actualizarse sin aviso visible). Un fine-grained token tiene 93 caracteres (`github_pat_` + 22 + `_` + 59); un 401 de GitHub con 94 fue un carácter de más al copiarlo. Después de editar `.env` hay que reiniciar `pnpm dev`: `tsx watch` no relee el `.env`.
    - Para probar con `curl.exe`, el token de dispositivo de la caja de desarrollo está en `%APPDATA%\com.novatech.ibizacaja\ibiza.db`, tabla `Ajustes`, `clave = 'token'`. Se lee sin instalar nada con `node:sqlite` (`new DatabaseSync(ruta, { readOnly: true })`).
  - F25d: el chequeo se hace **desde Rust** (`src-tauri/src/actualizacion.rs`), porque `check()` de JS no acepta la URL y la de la API vive en la SQLite de cada caja (`tauri.conf.json` no tiene `endpoints`). `buscar_actualizacion(apiUrl, token)` arma el updater con `updater_builder()`, el endpoint `{apiUrl}/api/actualizaciones?version=<la del binario>` y el token; si hay versión nueva la **descarga y verifica la firma** y la deja en memoria (estado `Pendiente`, con `.manage` en `lib.rs`); si ya hay una bajada, la devuelve sin ir a la red. `instalar_actualizacion` instala lo guardado (en Windows cierra la app y el instalador `passive` la reabre); si falla, la descarga queda para reintentar.
    - React: `useActualizacion` (en `CajaVinculada`, cada 30 min, `retry: false`, los errores se ignoran) · `AvisoActualizacion` en el encabezado de la venta (lee la caché con `skipToken`) · `PantallaActualizacion`, obligatoria, un solo botón, en `App.tsx` **antes del PIN** cuando no hay apertura (`!data && version`). No se espera la consulta: sin internet la caja arranca igual.
    - La versión de la app **se graba en el binario al compilar** (`"version": "../package.json"` + `generate_context!`). `package.json` está fuera de `src-tauri/`, así que cambiarlo no recompila: hay que tocar `src-tauri/tauri.conf.json` (o `touch`) para que Cargo lo vuelva a compilar. Para probar en dev se baja temporalmente a `0.0.9`.
  - F25e (hecho, 20/11/2026): publicados `caja-v0.1.1` (primera con updater; `0.1.0` no lo trae y nunca se actualiza sola) y `caja-v0.1.2`. Prueba: la 0.1.1 instalada, vinculada a la API de Azure con una "Caja Prueba", mostró el modal y quedó instalada la 0.1.2 (confirmado en el registro de Windows, `DisplayVersion`). Después se restauró la base de desarrollo y "Caja Prueba" se revocó y dio de baja.
    - **El updater de un build instalado solo acepta `https`**: con `http://localhost:3000`, `.endpoints()` devuelve `InsecureTransportProtocol` (en `tauri dev` es solo una advertencia), el error se ignora y la API no recibe nada. No usar `dangerousInsecureTransportProtocol`. Para probar un build instalado hay que ir contra Azure.
    - La app instalada y la de `tauri dev` comparten el identifier y por lo tanto la base (`%APPDATA%\com.novatech.ibizacaja\ibiza.db`). Para probar una instalación limpia: cerrar la app, mover `ibiza.db*` a `respaldo-dev\`, probar, borrar la base de prueba y restaurar.
    - Para repetir la prueba: subir la versión en `apps/caja/package.json`, tocar `src-tauri/tauri.conf.json`, commitear y crear el tag `caja-v<versión>`. Las cajas con una versión anterior la reciben en su próximo chequeo (cada 30 min o al arrancar).
- [ ] **F26** — Instalador y puesta a punto en el equipo real: pantalla completa, inicio automático, SmartScreen y prueba de una noche completa sin internet.

## Parte 2: mejoras (agendado el 19/11/2026)

Para cuando F25 y lo demás funcione; hoy no es prioridad. Para retomar: "seguimos con el paso M1".

- [ ] **M1** — Menú separado de comida y bebida, pero con un mismo carrito.
  - Decidido (20/11/2026): la comida usa **el mismo modelo** (Categoría → Producto → Variante), con un campo nuevo `seccion` (`BEBIDA` / `COMIDA`, default `BEBIDA`) en `Categoria`. La comida usa un envase "Unidad" creado desde administración. Promos, aumento, carrito, ticket, subida y reportes no cambian. **Un solo ticket**: la comida la prepara la misma barra. En la venta, pestañas Bebidas / Comidas arriba de las categorías (se ocultan si una sección no tiene categorías).
  - Sub-pasos: **M1a** backend (campo, migración, `SECCIONES` en `shared`, schema Zod, servicio y bajada) · **M1b** caja: migración 5 de SQLite y lectura · **M1c** pestañas en la venta (reusar `Pestanas` de `packages/ui`) · **M1d** sección en la pantalla de categorías · **M1e** prueba de punta a punta.
- [x] **M2** — Aumento de precio por caja: cada caja tiene un porcentaje propio. El precio del producto es el mismo para todas las PCs (cuando se actualiza, se actualiza para todas); el porcentaje se suma solo en el carrito.
  - Decidido (20/11/2026): campo `aumentoPorcentaje` (entero de 0 a 100, default 0) en `Caja`; lo edita el Admin y baja a su caja con la bajada (la fila `caja` viene siempre). La SQLite guarda el precio de la nube sin tocar; el aumento se aplica **al leer las variantes para vender**, así la tarjeta, el carrito, las promos, el ticket y el ítem guardado usan el mismo precio. Redondeo **hacia arriba a $100** (con 0 % el precio queda igual). La subida no cambia: el ítem ya lleva el precio aumentado como snapshot.
  - Sub-pasos: **M2a** backend (campo, migración, schema Zod, servicio de cajas y bajada) (hecho) · **M2b** `aplicarAumento` en `shared` con tests (hecho, 20/11/2026) · **M2c** caja: guardar el porcentaje y aplicarlo a las variantes (hecho, 20/11/2026) · **M2d** campo en la pantalla de cajas (hecho, 20/11/2026) · **M2e** prueba de punta a punta (hecho, 20/11/2026).
  - M2d: campo "Aumento %" en el formulario de `admin/cajas/Cajas.tsx` (vacío = 0; lo valida el mismo `CajaInputSchema`) y etiqueta "+N %" en la lista. Cambiar el aumento sube la versión global, así llega a la caja en la próxima bajada.
  - M2e: lo que ya está en el carrito **conserva el precio con el que se agregó** (el carrito copia el precio, igual que con un cambio de precio); solo lo que se agrega después usa el aumento nuevo. Sin internet, la caja sigue con el último porcentaje guardado en la SQLite.
- [x] **M3** — Mejorar el diseño: moderno, elegante, fuentes más chicas y tarjetas de producto nuevas.
  - Decidido (20/11/2026): paleta **grafito + violeta** (neutros fríos; el violeta `#7c3aed` solo en lo activo: categoría elegida, cobrar, foco) y tipografía **Inter**, empaquetada con `@fontsource-variable/inter` (nada de Google Fonts: la caja vende sin internet). Texto base de 15 px y botones de 52 px como mínimo.
  - Sub-pasos: **M3a** tokens en `tema.css` (paleta, fuente, escala de tamaños, radios, sombras) (hecho) · **M3b** componentes base de `packages/ui` e íconos SVG (hecho, 20/11/2026) · **M3c** tarjeta de producto y grilla (hecho, 20/11/2026) · **M3d** encabezado, carrito y botones de pago (hecho, 20/11/2026) · **M3e** pantallas secundarias (PIN, apertura, retiro, cambio de cajero, anulación, cierre, impresora, vincular, actualización) centradas y con la escala nueva (hecho, 20/11/2026) · **M3f** administración y alertas de SweetAlert (hecho, 20/11/2026).
  - Criterios de M3b para el resto del diseño: los componentes usan solo tokens de `tema.css` (sin px sueltos); el hover va siempre dentro de `@media (hover: hover)` para que no quede "pegado" en la pantalla táctil; `prefers-reduced-motion` ya lo cubre `tema.css` y no se repite; los íconos salen de `Iconos.tsx` y un botón con solo ícono lleva `aria-label`.
  - M3c: los precios no van en violeta (el violeta aparece solo al tocar la variante, como confirmación). La tarjeta tiene foto de alto fijo (sin imagen muestra la inicial) y nombre de 2 renglones como máximo, para que la grilla quede pareja. Las categorías son píldoras con contador y la elegida se marca con `aria-pressed`, que el CSS usa como selector. Token nuevo `--espacio-medio` (12 px). Pendiente aparte (no es diseño): el cartel de promo en la tarjeta. Los envases de la tarjeta van con `flex-wrap` (no `grid-auto-flow: column`, que con 3 envases se salía de la tarjeta), y por eso la grilla queda en `minmax(220px, 1fr)`.
  - M3d: el encabezado muestra la **letra y la fecha de la jornada** (de `useApertura`, con `fechaTicket` de `lib/ticket.ts`); solo con el modo jornada, porque sin él se calculan en cada venta y pueden cambiar en el corte. Nombre de la caja sin violeta. Acciones del encabezado de 44 px (`--tactil-chico`). Los 3 medios de pago van en una fila con el ícono arriba (80 px de alto), para dejarle más lugar a los ítems del carrito.
  - M3e: las pantallas secundarias se arman con las piezas de `apps/caja/src/componentes/Dialogo.tsx`: `Dialogo` (tarjeta centrada con título y ayuda; `tamaño` chico 440 px para teclado, medio 560 px para formularios, grande 780 px para dos columnas), `Cifra` (visor del número que se teclea, con `--texto-3xl`), `Mensaje` (error o aviso; siempre ocupa su lugar para que el teclado no salte), `Acciones` (botones del pie; si no entran, bajan de fila) y `Opciones` (motivos, con `aria-pressed`). Una pantalla nueva tiene que usarlas en vez de repetir el CSS. Retiro va en dos columnas (en una no entraba en 768 px de alto con el teclado de 64 px). En el PIN, los usuarios van en 2 columnas con su inicial. En anulación, el ticket se muestra como un papel punteado y el botón Anular es rojo (`peligro`).
  - M3f: la variante `peligro` de `Boton` pasó a **rojo suave** (fondo al 10 %, se llena al tocar o pasar el mouse), así las listas con un "Dar de baja" por fila no pesan. Las pestañas de Catálogo y Reportes usan `admin/Pestanas.tsx` (control segmentado, genérico en el id). El menú de la administración tiene un ícono por sección (`ICONO_SECCION` en `Marco.tsx`, un `Record<IdSeccion, …>`). Las listas de `Catalogo.module.css` son un solo recuadro con renglones, y las tablas de reportes van en un recuadro con encabezado hundido. Alertas: `lib/alertas.ts` usa `buttonsStyling: false` + `customClass` con las clases de `alertas.css` (tokens del tema); el ancho va por la opción `width` porque SweetAlert lo pone en línea. `confirmar(titulo, texto, { peligro })`: rojo solo para vaciar el carrito y anular; el resto confirma en violeta.
- [x] **M4** — Si el encargado ya abrió la caja, que no vuelva a pedir otro código (hecho, 20/11/2026).
  - Se amplió a las cinco acciones que pedían PIN de encargado: apertura, retiro, anulación, cierre y configurar la impresora. Si quien está en la caja es Encargado o Admin, no se pide PIN (ya lo puso al entrar): solo una confirmación con el monto o el ticket (`confirmar` de `lib/alertas.ts`). El cierre ya tenía "¿Contaste $X?" y no suma otra; la impresora abre directo. Un Cajero sigue pidiendo el PIN de un encargado. La operación queda registrada con el mismo usuario como cajero y como autorizante.
  - La decisión vive en `apps/caja/src/lib/autorizacion.ts`: `ROLES_AUTORIZAN` (única copia de `["ENCARGADO", "ADMIN"]`) y `puedeAutorizar(usuario, roles?)`, un _type guard_ (`usuario is Usuario`).
  - Riesgo aceptado: si el encargado deja la caja sin tocar "Salir", cualquiera puede retirar con una confirmación (queda auditado a su nombre). Avisarle al cliente.

### Observación: qué hace falta para instalar en producción (anotado el 11/11/2026)

Solo para tener en cuenta; **no cambia el orden de la hoja de ruta**. La apertura del boliche está prevista para el **31/12/2026**.

- **Imprescindible antes de instalar**: F14 (primer admin), F15 (crear cajas y usuarios reales), **F25** (updater) y F26 (instalador).
  - F25 tiene que estar en la **primera** instalación: una versión instalada sin updater no se actualiza sola y obligaría a reinstalar a mano en cada PC.
- **Para que el cliente administre solo** (cambiar precios y promos sin depender del desarrollador): F16, F17, F18 y un lugar donde usarlas, F22 (escritorio) o F23 + F24 (web).
- **Puede quedar para después de abrir**: F19 (reportes; las ventas igual quedan en Azure), F20 (si las altas las hace el desarrollador) y F21 (imágenes).
- **Bloquea aunque no sea un paso**: ver "Producción (antes de abrir el boliche)". Además, `CORS_ORIGENES` de producción tiene que incluir `http://tauri.localhost`.
- **Si no da el tiempo**: hacer F14 → F15 → F25 → F26, abrir con la administración por API (Postman o scripts) y sumar las pantallas después.

## Cambios de rumbo

Esta sección **tiene prioridad** sobre lo descrito arriba si hay contradicción. Se integra al resto del documento más adelante.

1. **Aplicación sencilla y modos configurables.** El cliente quiere algo simple. Se sigue con el diseño actual, pero las funciones que quizás no use tienen que poder **activarse/desactivarse** sin rehacer nada. En particular la **jornada** (abrir/empezar la jornada): puede que el cliente no quiera ese paso. Por lo tanto:
   - Diseñar la jornada como un **modo opcional** (configuración en Azure que baja a las cajas), no como algo cableado en toda la lógica.
   - Con la jornada desactivada, la app tiene que funcionar igual: vender, imprimir ticket y cerrar caja sin exigir una jornada abierta. Hay que definir de dónde sale entonces la fecha del ticket, la letra y la vigencia de promos (probablemente de la fecha/hora real, o de la jornada calculada por el horario de corte, sin paso manual).
   - Evitar que ventas, promos y tickets dependan de forma obligatoria de una `Jornada`; la relación debe poder ser opcional.
2. **Actualización automática de la app de escritorio.** La app se instala una vez en cada PC y no se reinstala con pendrive. Cuando hay una versión nueva publicada en GitHub, la app muestra un **modal** avisando que hay que actualizar y se actualiza desde ahí. Por lo tanto:
   - Usar el updater de **Tauri** (`tauri-plugin-updater`, ver punto 4) con **GitHub Releases** como fuente de las versiones. Tauri exige firmar los paquetes de actualización con su propia clave (distinta de la firma de código de Windows).
   - Las versiones se publican como release (instalador + metadatos) desde el repo, idealmente con un workflow de GitHub Actions al crear un tag; no basta con hacer push al código.
   - El modal de actualización: avisa que hay versión nueva, deja actualizar y reiniciar. Definir si es obligatoria u opcional y que **nunca interrumpa una venta en curso** (la caja vende de noche, ver Jornada).
   - Si el repo es privado, el updater necesita un token de solo lectura; evaluar hacer los releases públicos o usar otro hosting para los instaladores.
   - Firma de código en Windows: sin certificado aparece la advertencia de SmartScreen; definir cómo se maneja.
3. **Cantidad y distribución de PCs sin definir.** No se sabe cuántas cajas habrá. Lo seguro es que el boliche tiene **varias PCs repartidas por barra**; por ejemplo una para afuera, una para el VIP y una barra interior que podría tener **2 o 3 PCs en la misma barra**. Por lo tanto:
   - No asumir "5 o 6 cajas" ni una caja por barra: el sistema debe soportar **N cajas**, dadas de alta desde Azure.
   - Hay que decidir cómo se **registra cada jornada/apertura por PC**: opciones a evaluar, (a) cada PC abre y cierra su propia caja con su arqueo, aunque compartan barra; (b) agrupar las PCs en una **barra/puesto** con un arqueo común. Por defecto, cada PC es una caja independiente (correlativo propio, apertura, arqueo y cierre propios).
   - Evaluar un campo opcional de **barra/ubicación** en `Caja` (ej: "Afuera", "VIP", "Barra interior") para poder agrupar en los reportes sin cambiar la lógica de venta.
   - El correlativo del ticket ("C2-0147") y la sincronización por red local no deben suponer un número fijo de cajas.
   - Pendiente de consultar al cliente: cuántas cajas y cómo están repartidas, y si el dinero de una barra con varias PCs se cuenta junto o por separado.
4. **Stack tecnológico actualizado.** Reemplaza lo de la sección "Stack" donde contradiga (en particular: **Tauri en lugar de Electron**).
   - **Nube (Azure)**: Azure SQL (base central), **API** y **Blob Storage** central de imágenes (imágenes de productos).
   - **Base local de cada PC**: **SQLite**.
   - **API**: Node.js, Express, TypeScript, Zod, Prisma.
   - **Front end (app de caja)**: **Tauri**, React, TypeScript, Zustand, TanStack Query, SweetAlert, Axios.
   - Consecuencias a tener en cuenta:
     - Ya no hay Electron ni `electron-updater`: la actualización usa el updater de Tauri (punto 2).
     - Tauri tiene backend en **Rust**: el acceso a SQLite local, la impresión térmica ESC/POS y el mDNS de la red local se hacen desde Rust (comandos/plugins de Tauri) o con plugins existentes, no con módulos de Node. Probar la impresora real temprano.
     - Queda resuelto "Prisma vs Drizzle para el SQLite": en la caja el SQLite se maneja desde Tauri (p. ej. `tauri-plugin-sql`), no con Prisma. Prisma queda solo en la API con Azure SQL.
     - Las imágenes viven en Blob Storage; las cajas deben **cachearlas localmente** para vender sin internet (offline-first).
     - Zustand para estado de UI/carrito, TanStack Query para datos y sincronización, Axios para llamar a la API.
5. **Diseño de la app: pantalla de venta permanente, casi sin teclado.** Reemplaza lo de "Pantalla de venta" donde contradiga.
   - Pensada como **POS táctil**: casi sin teclado. Si alguna función lo necesita (PIN, motivo, búsqueda), se usa un teclado, preferentemente **en pantalla**.
   - La app está **siempre en la pantalla de venta**; las demás funciones (retiros, cierre, promos, configuración) son accesos secundarios que vuelven a la venta.
   - **Izquierda: productos** en tarjetas grandes. Cada producto puede tener **variantes de tamaño/envase** (vaso, tanque, etc.), cada una con su precio. Puede mostrarse como una tarjeta con un botón por tamaño, o como dos tarjetas separadas del mismo producto con distinto tamaño y precio; se decide en el diseño, el modelo de datos (producto + variante con precio) no cambia.
   - **Derecha: carrito** con el resumen de la compra (ítems, descuentos de promo, total).
   - **Cobro en un toque:** debajo del carrito hay **3 botones de medio de pago: Efectivo, Transferencia y Tarjeta**. Al tocar uno se registra el medio y se cierra la venta (imprime ticket); no hay un paso previo de "COBRAR".
   - Botones grandes, pensados para usar de noche y con apuro; "Vaciar" carrito alejado de los botones de pago o con confirmación.
   - **Cambio de medios de pago:** el tercer medio pasa a ser **Tarjeta** (antes estaba "Mercado Pago (QR)"). Pendiente de confirmar si Mercado Pago/QR queda como parte de "Tarjeta" o como otro botón, y si en Efectivo se muestra "paga con" y vuelto (eso sí necesitaría números; hacerlo con montos rápidos en botones).
6. **Respuestas del cliente (reunión 31/10/2026).** Tienen prioridad sobre los puntos 1, 3 y 5 donde contradigan.
   - **Sin facturación fiscal**: el ticket es solo un comprobante interno para la barra. No hay integración con ARCA/AFIP.
   - **5 cajas**, una por PC, cada una con su **propio cierre y arqueo** (opción (a) del punto 3). No hace falta agrupar el dinero por barra.
   - **Jornada: sí quieren el paso de abrir la noche.** Se mantiene el modo configurable, pero por defecto queda **activado**. Horario real: aprox. 21:00 a 06:00; el corte se fija con margen (propuesta: **18:00 a 10:00**).
   - **Medios de pago**: Efectivo, **Mercado Pago (QR)** y **Tarjeta** van como **botones separados**. Transferencia: falta confirmar si se mantiene (serían 4 botones). `CierreCaja` necesita un total por cada medio (agregar `totalTarjeta`; `totalMercadoPago` se mantiene).
   - **Consumiciones**: puede haber (ej: incluidas en la entrada, cortesías). Hay que modelarlas como una venta registrada pero sin cobro (ver pendientes).
   - **Internet**: hay, y llega a todas las barras. La red local queda como respaldo, no como camino principal.
   - **Todavía no hay equipamiento**: el boliche no está operativo y no tiene PCs, pantallas ni impresoras. Hay que **recomendar qué comprar** (PC/all-in-one táctil, impresora térmica 80 mm ESC/POS, UPS, cajón de dinero) y conseguir una impresora para probar temprano.
7. **Medios de pago definitivos (02/11/2026).** Tiene prioridad sobre los puntos 5 y 6 y sobre la sección "Pagos".
   - Son **3 botones: Efectivo, Transferencia y Tarjeta**. No hay un medio de pago `MERCADO_PAGO`: un pago con Mercado Pago (QR) se registra como **Transferencia**.
   - `CierreCaja` guarda `totalTarjeta` y `totalTransferencia`; no lleva `totalMercadoPago`. Los reportes no separan Mercado Pago de las demás transferencias.
8. **Web y escritorio comparten la administración (02/11/2026).** Tiene prioridad sobre lo anterior donde contradiga.
   - **Web (`apps/panel`)**: misma interfaz que el escritorio, sin ventas y sin SQLite. Lee y escribe directo en Azure por la API.
   - **Escritorio (`apps/caja`)**: todo lo de la web con login de administración, más ventas, SQLite y sincronización.
   - **Las pantallas de administración se escriben una sola vez** en `packages/ui` y las usan las dos apps. `packages/ui` se suma a la estructura del monorepo y `apps/panel` se crea en el paso F23.
   - **La administración requiere internet, también en el escritorio.** Sin internet se sigue vendiendo, pero no se cambian precios ni se ven reportes. Un cambio hecho en administración llega a las cajas por la sincronización de bajada.
   - Quedan sin efecto el punto 3 del protocolo de sincronización (cambio de precio desde una caja) y el aviso de precios por red local.
   - **Dos logins distintos**: email y contraseña para la administración (Admin y Encargado), y PIN para operar la caja. El PIN no sirve para entrar a la administración.
   - **Permisos en administración**: el Encargado solo cambia precios y promos. Altas y bajas de productos, usuarios, cajas y reportes quedan para el Admin.

## Pendientes y preguntas abiertas

- Integración con Mercado Pago (consultar al cliente).
- Recomendar equipamiento para comprar (PCs táctiles, impresoras, UPS, cajones) y conseguir una impresora para probar.
- Confirmar horario de corte de la jornada (propuesta 18:00 a 10:00).
- Diseño de la pantalla de cobro.
- Avisarle al cliente que Mercado Pago va dentro de Transferencia (en la reunión del 31/10 se había hablado de botones separados).
- Consumiciones: ¿cómo llegan a la barra (vale/pulsera/entrada)? ¿Quién las autoriza? ¿Hay tope por persona? ¿Se cuentan aparte en el cierre?
- ¿En Efectivo se muestra "paga con" y vuelto (montos rápidos en botones)?
- ¿Cómo se maneja SmartScreen sin certificado de firma de código? (se ve en F26). Lo demás del updater quedó resuelto en F25: obligatoria solo con la caja cerrada, y los releases del repo privado pasan por la API.

### Producción (antes de abrir el boliche)

- **Primer admin**: resuelto (12/11/2026). Se creó con `apps/api/src/scripts/crear-admin.ts`, corrido desde la consola SSH del App Service (`node dist/scripts/crear-admin.js` con `ADMIN_NOMBRE`, `ADMIN_PIN`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`). El script se niega si ya hay un admin con acceso al panel. El seed sigue sin correrse en producción.
- **Azure SQL**: hoy usa la oferta gratis; al agotarse el límite, la base se pausa hasta el mes siguiente. Pasarla a paga antes de operar.
- **App Service**: confirmar que `novatech-plan-br` alcance (lo comparte con otras apps) y tenga Always On.
- **`CORS_ORIGENES`**: resuelto (18/11/2026). Tiene la URL del panel, `http://tauri.localhost` y la de la propia API (esta última sobra pero no molesta). El CORS de plataforma del App Service queda vacío para que decida Express.
- **Recuperar la contraseña del panel**: `apps/api/src/scripts/resetear-password.ts`, por SSH en el App Service (`cd /home/site/wwwroot`, `read -s ADMIN_PASSWORD && export ADMIN_PASSWORD`, `ADMIN_EMAIL=... node dist/scripts/resetear-password.js`). Pisa la contraseña de un `AccesoPanel` existente y deja `RESET_PASSWORD` en la auditoría. En desarrollo: `pnpm --filter @ibiza/api admin:password`.
- **`GITHUB_TOKEN` en el App Service**: resuelto (19/11/2026). Cargado en _Environment variables_; `/api/actualizaciones` probado contra Azure. Si se regenera el token en GitHub, hay que actualizarlo ahí y en `apps/api/.env` (es obligatorio: sin él la API no arranca).
- **Application Insights**: previsto en el stack, todavía sin activar.
- **Clave de la letra de la semana**: en producción vive en la variable `CLAVE_LETRA` del App Service (cargada el 12/11/2026, distinta de la de desarrollo). Si se cambia, cambian las letras de los tickets.
