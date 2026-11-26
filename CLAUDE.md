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

- [x] **M1** — Menú separado de comida y bebida, pero con un mismo carrito.
  - Decidido (20/11/2026): la comida usa **el mismo modelo** (Categoría → Producto → Variante), con un campo nuevo `seccion` (`BEBIDA` / `COMIDA`, default `BEBIDA`) en `Categoria`. La comida usa un envase "Unidad" creado desde administración. Promos, aumento, carrito, ticket, subida y reportes no cambian. **Un solo ticket**: la comida la prepara la misma barra. En la venta, pestañas Bebidas / Comidas arriba de las categorías (se ocultan si una sección no tiene categorías).
  - Sub-pasos: **M1a** backend (campo, migración, `SECCIONES` en `shared`, schema Zod, servicio y bajada) (hecho) · **M1b** caja: migración 5 de SQLite y lectura (hecho) · **M1c** pestañas en la venta (reusar `Pestanas` de `packages/ui`) (hecho) · **M1d** sección en la pantalla de categorías (hecho) · **M1e** prueba de punta a punta (hecho, 20/11/2026).
  - `Pestanas` pasó de `admin/` a `packages/ui/src/componentes/` y se exporta desde `@ibiza/ui`. La migración 5 de la caja vuelve `versionCatalogo` a 0 para que la bajada traiga las categorías con su sección. En la venta, si la sección elegida se queda sin categorías (por ejemplo, se dan de baja), se pasa sola a la primera que tenga.
  - Las cajas instaladas hasta la 0.1.2 ignoran `seccion` y muestran la comida mezclada con las bebidas. La reciben con el próximo release de la caja.
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
- [x] **M5** — Registrar lo que se descarta del carrito, para detectar a quien cobra sin pasar la venta.
  - Decidido (23/11/2026):
    - **Restar un ítem no escribe en la base**: el carrito lo anota en memoria, en una lista `quitados` aparte de `items`.
    - **Al cobrar**, si hay `quitados`, se guardan con la venta **en la misma transacción** (acción `ITEMS_QUITADOS`, con el número de venta). Sin quitados no se escribe nada de más.
    - **Al vaciar**, se guarda lo que había en el carrito más los `quitados` y el total descartado (acción `CARRITO_VACIADO`).
    - **Salir con el carrito cargado o con `quitados` cuenta como vaciar**, a nombre de quien sale. Hoy `salir()` no limpia el carrito y lo hereda el próximo cajero.
    - **Quitar y volver a agregar igual queda anotado** (no se descuenta): es más simple y no deja esconder maniobras.
    - Después de cobrar o vaciar se limpian `items` y `quitados`.
  - Va en `AuditoriaCaja` (`accion` + `detalle` JSON), que ya sube por la cola: **sin migraciones**. La API acepta cualquier `accion` de hasta 50 caracteres, así que no hace falta deploy previo. El registro **no va dentro de `vaciar()` del store**: `useCobrar` lo llama después de cada venta. El store solo anota y limpia; guardan la pantalla (vaciar o salir) y el cobro.
  - Sub-pasos: **M5a** acciones nuevas en `shared` y `quitados` en el store del carrito (hecho, 23/11/2026) · **M5b** guardar al vaciar y al salir (hecho, 23/11/2026) · **M5c** guardar los quitados junto con la venta (hecho, 23/11/2026) · **M5d** reporte "Descartes por cajero" (endpoint y pestaña en Reportes) (hecho, 23/11/2026) · **M5e** prueba de punta a punta (hecho, 24/11/2026).
  - M5a: `quitados` es un `ItemQuitado[]` (`varianteId`, `nombre`, `envaseNombre`, `precio`, `cantidad`), agrupado por `varianteId`. `cambiarCantidad` anota solo con un cambio negativo y nunca más de lo que había. `vaciar()` limpia las dos listas y no registra nada.
  - M5d: `GET /api/reportes/descartes` (`descartePorCajero` en `reporte.service.ts`) suma el `total` del `detalle` de `ITEMS_QUITADOS` y `CARRITO_VACIADO` en JS (es JSON en un `NVARCHAR`, no se puede con `groupBy`); un `detalle` roto cuenta $0. Compara con el `subTotal` de las ventas válidas (precio de lista, igual que los descartes). Pestaña `DescartesPorCajero.tsx`: el % es `descartado / (vendido + descartado)`, así un cajero sin ventas que descartó sale 100 %; se resalta desde `UMBRAL_AVISO` = 10 % (provisorio).
- [x] **M6** — Pantalla del cliente en el segundo monitor de la all-in-one.
  - Decidido (23/11/2026):
    - **Siempre muestra el logo** de Ibiza Club, grande y centrado, en tema oscuro. En una **caja de entrada**, al cobrar aparece "¡Gracias! Bienvenidos a Ibiza" durante 6 s y vuelve al logo; si entra otra venta mientras se muestra, los 6 s vuelven a empezar. En la barra no cambia nada.
    - **Detección automática, sin configuración**: al arrancar, si hay un monitor distinto del de la ventana de la caja, se abre ahí la ventana `cliente` en pantalla completa (sin bordes ni barra de tareas). Con un solo monitor no se abre nada; en desarrollo (`cfg!(debug_assertions)`) se abre una ventana de prueba de 800×450.
    - **La ventana se crea desde Rust** (`setup` de `lib.rs`), así aparece aunque la caja esté en el PIN, sin vincular o actualizándose. Si falla, se muestra con `eprintln!` y la caja arranca igual. Después de abrirla se le devuelve el foco a la caja para que no se pierda el primer toque.
    - **Es la misma app con otra raíz**: `main.tsx` mira `getCurrentWindow().label` y, en la ventana `cliente`, monta solo `<PantallaCliente />` (sin `App`, sin `QueryClientProvider`, sin SQLite ni sincronización).
    - **Comunicación por eventos de Tauri**: la caja hace `emitTo("cliente", …)` y el cliente hace `listen(…)`. Si no hay segundo monitor, el evento se pierde sin error y nunca rompe un cobro.
    - Al cerrar la ventana `main` se cierra la app entera (`on_window_event` con `Destroyed`); si no, el proceso seguiría vivo con la ventana del cliente.
    - Sin API, sin SQLite y sin migraciones: es todo de la caja.
  - Sub-pasos: **M6a** Rust: abrir la ventana en el segundo monitor (hecho, 23/11/2026) · **M6b** React: la pantalla del cliente (hecho, 23/11/2026) · **M6c** avisar al cobrar una entrada (hecho, 23/11/2026) · **M6d** prueba de punta a punta y release (hecho, 25/11/2026).
  - M6a: `src-tauri/src/pantalla_cliente.rs` (`ETIQUETA = "cliente"`, `abrir(app)`). El monitor se elige como **el primero cuya posición difiere del de la ventana `main`**, no el "principal" de Windows. La ventana se crea oculta, se mueve con la posición física del monitor (no se corre con escalas distintas), pasa a pantalla completa y recién ahí se muestra. `capabilities/cliente.json` solo tiene `core:default`: sin `sql` ni `updater`.
  - M6b: `src/lib/pantallaCliente.ts` es la única copia del contrato entre ventanas (`VENTANA_CLIENTE`, `EVENTO_ENTRADA = "cliente:entrada"` y `avisarEntradaVendida()`, que emite con `.catch(() => {})` y devuelve `void`). `pantallas/PantallaCliente.tsx`: la limpieza del efecto hace `dejarDeEscuchar.then((dejar) => dejar())` (con `StrictMode`, si no se llama quedan dos oyentes). El oscuro se fuerza **en `main.tsx`, antes del `render` y solo en la ventana del cliente**, con `dataset.tema` + `useTema.setState` (no `alternar()`, que lo guardaría en el `localStorage` compartido y le cambiaría el tema a la caja; y sin `setState` el `Logo` elige la imagen de texto negro). El CSS usa `vh`/`vw` en vez de tokens (excepción documentada: no se sabe el tamaño de esa pantalla), `.pantalla .logo` para ganarle en especificidad a `Logo.module.css`, y `cursor: none`.
  - Para probar sin cobrar, desde la consola de la ventana del cliente: `await window.__TAURI_INTERNALS__.invoke("plugin:event|emit", { event: "cliente:entrada", payload: null })`.
  - M6c: en `hooks/useCobrar.ts`, justo después de `registrarVenta(...)` y antes de imprimir, si `esEntrada`, se llama `avisarEntradaVendida()` sin `await`. Va antes de imprimir para que el cliente vea el "Gracias" al pagar aunque la impresora tarde o quede esperando el reintento; sin `await` y con el `.catch` interno, nunca hace fallar un cobro ya guardado. Probado con la ventana de prueba y una caja de entrada con General y VIP.
  - M6d (hecho, 25/11/2026): probar con un monitor (ventana de prueba) y con un segundo monitor real o una TV por HDMI; comprobar que un build instalado con un solo monitor no abre ninguna ventana extra; subir la versión, tocar `tauri.conf.json` y publicar el tag `caja-v<versión>`.
- [x] **M7** — Pantalla del cliente en la barra: mostrar lo que se compra (agendado el 23/11/2026).
  - Idea: lo mismo que M6 (logo de fondo en el segundo monitor), pero en las **cajas de barra**. Al vender, cada producto aparece **grande, con su foto y su nombre** (ej: la foto del vino y "Vino") y después hace una **transición** que lo achica y lo suma a una **lista chica** con todo lo que compró. Si hay más productos, sale el siguiente (ej: "Cerveza") grande y se suma a la lista, uno por uno.
  - Se apoya en lo de M6: la ventana `cliente`, los eventos de Tauri y el contrato en `lib/pantallaCliente.ts` (sumar un evento nuevo, ej. `cliente:venta`). La ventana del cliente no tiene SQLite: **los datos viajan en el evento** (nombre, envase, cantidad e imagen de cada ítem). Las fotos salen de la caché local de F21d (`$APPDATA/imagenes/`, protocolo `asset`); revisar que la ventana `cliente` pueda leerlas. Sin foto, mostrar la inicial como en la tarjeta de venta.
  - Decidido (23/11/2026):
    - **Se muestra al cobrar**, no mientras se arma el carrito: un solo evento `cliente:venta` por venta, emitido en `useCobrar` en el mismo lugar que el de la entrada (después de `registrarVenta`, sin `await`). Restar o vaciar el carrito no le avisa nada al cliente.
    - **Secuencia**: un producto por **línea** de la venta (agrupado por variante: "2 x Vino" sale grande una vez), grande con foto y nombre durante **1,5 s**, y se achica hacia la lista. Con muchas líneas se acorta cada una para que la secuencia no pase de **8 s** (mínimo 0,6 s por línea). Después la lista completa queda **4 s**, luego **"¡Gracias!" 4 s** y vuelve al logo.
    - **La lista** lleva cantidad, nombre con envase y precio de la línea, la línea de promo con su descuento (igual que el ticket) y el **TOTAL** grande abajo.
    - **Si entra otra venta mientras se muestra la anterior, la corta** y empieza la nueva desde cero (igual que los 6 s de M6).
    - **Los datos viajan en el evento**: la línea lleva la imagen ya convertida con `convertFileSrc` (la URL `asset://` sirve en cualquier ventana de la app). Para eso el carrito copia `imagen` del producto al agregar, igual que copia el nombre. El scope del protocolo `asset` es de la app, no de la capability: `cliente.json` no cambia.
  - Sub-pasos: **M7a** contrato del evento, imagen en el carrito y aviso al cobrar (hecho, 23/11/2026) · **M7b** `PantallaCliente` con los modos (logo, gracias de entrada, venta de barra) y la secuencia (hecho, 24/11/2026) · **M7c** diseño y transición de grande a la lista (hecho, 24/11/2026) · **M7d** prueba de punta a punta (hecho, 24/11/2026).
  - M7a: `lib/pantallaCliente.ts` suma `EVENTO_VENTA = "cliente:venta"`, los tipos `LineaCliente` (`cantidad`, `nombre` con el envase entre paréntesis, `imagen`, `subTotal`, `promocionNombre`, `descuento`) y `VentaCliente` (`lineas`, `total`), y `avisarVentaBarra(lineas, total)`. Las dos funciones de aviso pasan por un `emitir()` privado con el `.catch` vacío. `ItemVenta` y `LineaVenta` llevan `imagen` (ya convertida por `srcImagenLocal` al leer los productos). En `useCobrar`, una caja de entrada avisa la entrada y una de barra avisa la venta.
  - Sin API, sin SQLite y sin migraciones: es todo de la caja, como M6.
- [x] **M8** — Promos en cualquier día de la semana (antes solo `VIERNES` / `SABADO` / `AMBOS`).
  - Decidido (24/11/2026):
    - `dias` es una **lista de días** (`0` = domingo … `6` = sábado), como `Date.getUTCDay()`. En `shared`: `DIAS_SEMANA`, `NOMBRE_DIA` (`"Dom"` … `"Sáb"`), `diasATexto([5, 6]) → "5,6"` y `textoADias("5,6") → [5, 6]` (ignora lo que no sea un día válido, así un valor viejo como `"AMBOS"` da `[]`). Se borraron `DIAS_PROMOCION` y `DiaPromocion`.
    - `PromocionBaseSchema.dias`: arreglo de enteros 0-6, al menos uno ("Elegí al menos un día"); el `transform` quita repetidos y ordena. `promoVigente` mira si el día de la **fecha operativa** está en la lista.
    - **La columna no cambia** (`dias NVARCHAR(20)`, con texto `"5,6"`; los 7 días son 13 caracteres). La API convierte en los dos sentidos: el panel manda y recibe arreglos. **La bajada manda el texto tal cual** (`sync.service.ts` no cambia) y la SQLite de la caja lo guarda como texto: la caja convierte al leer.
    - Las cajas instaladas (0.1.x) toman todo lo que no sea `VIERNES` ni `SABADO` como "ambos": con `"5,6"` andan bien, pero una promo de un solo día les vale viernes y sábado hasta que se actualicen.
  - Sub-pasos: **M8a** `shared`: días, schema, vigencia y tests (hecho, 24/11/2026) · **M8b** backend: migración de datos, servicio de promos y seed (hecho, 24/11/2026) · **M8c** caja: leer `dias` con `textoADias` en `db/promociones.ts` (sin migración de SQLite) (hecho, 24/11/2026) · **M8d** panel: mostrar los días en la lista de promos (`usePromociones.ts`, `descripcion.ts` con `NOMBRE_DIA`) (hecho, 24/11/2026) · **M8e** prueba de punta a punta y release de la caja (hecho, 25/11/2026).
  - M8b: migración `dias_promocion_lista`, solo de datos (creada con `--create-only`): `VIERNES → '5'`, `SABADO → '6'`, `AMBOS → '5,6'`, y **sube la versión global y la de cada promo convertida**, así las cajas las vuelven a bajar (si no, se quedarían con `"VIERNES"`, que la caja nueva lee como `[]`, y la promo no se aplicaría nunca). Aplicada en desarrollo el 24/11/2026; en producción corre sola con el deploy. Seed: `dias: number[]` y guarda `diasATexto(input.dias)` (hecho). `promocion.service.ts`: `aRespuesta` devuelve `textoADias(dias)` y `datosPromo` guarda `diasATexto(input.dias)`. Verificado: `GET` devuelve `[5, 6]`; `POST` con `[4, 5, 5]` guarda `"4,5"`; con `[]` da 400; la bajada manda el texto.
  - M8d: no existía formulario de promos (la pantalla solo lista, pausa y da de baja; se crean por API). `textoDias` en `descripcion.ts` arma "Vie y Sáb" / "Todos los días". El formulario quedó como paso aparte: **M9**.
- [x] **M9** — Formulario de alta y edición de promociones en la administración (agendado el 24/11/2026). El backend ya está (`POST /promociones` y `PUT /promociones/:id`, Admin y Encargado, validados con `PromocionInputSchema`): es solo `packages/ui`.
  - Decidido (24/11/2026): **vista aparte**: botón "Nueva promoción" arriba de la lista y "Editar" en cada fila; el formulario reemplaza a la lista y al guardar o cancelar vuelve. **Alcance con botones**: categorías en una fila de botones y productos agrupados por categoría, que se prenden y apagan (`aria-pressed`), sin teclado. Días y envases, igual. Horario: "Toda la noche" o desde/hasta.
  - Sub-pasos: **M9a** componente `Interruptores` en `packages/ui/src/componentes/` (elegir varios con `aria-pressed`) (hecho, 24/11/2026) · **M9b** `formularioPromo.ts`: estado del formulario, de promo a formulario y de formulario a `PromocionInput` (hecho, 24/11/2026) · **M9c** `FormularioPromocion.tsx`: nombre, tipo, valores, días y horario (hecho, 24/11/2026) · **M9d** alcance (categorías y productos) y envases (hecho, 24/11/2026) · **M9e** integrarlo en `Promociones.tsx` (Nueva / Editar, `POST` y `PUT`) (hecho, 25/11/2026) · **M9f** prueba de punta a punta (hecho, 25/11/2026).
  - M9b: `FormularioPromo` guarda los números como texto (lo que se tipea) y `todaLaNoche` aparte. `PROMO_VACIA` arranca en 2x1 viernes y sábado. `desdePromo(promo)` arma el formulario para editar y `validarPromo(form)` hace `PromocionInputSchema.safeParse` mandando solo los valores del tipo elegido (el schema rechaza los que sobran).
  - M9c: `FormularioPromocion` recibe `inicial`, `titulo`, `guardando`, `onGuardar(input)` y `onCancelar`; no llama a la API (eso es M9e) y lee `inicial` una sola vez (montarlo con `key` por promo). Tipo y horario con `Pestanas`, días con `Interruptores`, horas con `CampoSelect` cada 30 min de 18:00 a 10:00 en el orden de la noche. "Con horario" sin las dos horas lo controla el componente (`faltaHorario`), porque el schema lo tomaría como toda la noche. El error se muestra solo después de tocar algo (`form !== inicial`). En `Promociones.tsx` quedó montado como prueba temporal, hasta M9e.
  - M9d: el formulario recibe `categorias`, `productos` y `envases` por props (los carga `Promociones.tsx`; el formulario sigue sin llamar a la API). Se ofrecen los activos más los dados de baja que la promo ya tiene, marcados "(baja)", para poder quitarlos. Las categorías de sección `ENTRADA` no se ofrecen. Productos agrupados por categoría, un `Interruptores` por grupo (`cambiarProductos` reemplaza solo los de esa categoría). Prender una categoría borra sus productos sueltos y el grupo muestra "Entra toda la categoría".
  - M9e: `Promociones.tsx` tiene un solo estado `editando` (`null` = lista, `"nueva"` = alta, una promo = edición); con el formulario abierto no se ve la lista. Guardar hace `POST /promociones` o `PUT /promociones/:id` y vuelve a la lista solo si salió bien (si falla, queda lo escrito y el error arriba). "Editar" solo en las activas: una dada de baja primero se reactiva. El formulario compara `tocado` contra el estado del montaje, no contra la prop `inicial` (`desdePromo` arma un objeto nuevo en cada render).

- [ ] **M10** — Pantalla del cliente en vivo en la barra (cambia M7; agendado el 25/11/2026).
  - Decidido (25/11/2026), tiene prioridad sobre las decisiones de M7:
    - **Se muestra mientras se arma el carrito**, no al cobrar. Con el carrito vacío, logo. Con productos, la **lista** (cantidad, nombre con envase, precio, línea de promo con su descuento y TOTAL) está siempre a la vista y se actualiza sola.
    - **Al agregar** (tarjeta o "+" del carrito), ese producto sale **grande con foto y la cantidad de su línea** ("2 x Vino") durante **1,5 s** y se achica hacia la lista. Agregar otra unidad de algo que ya está también lo muestra grande.
    - **Toques rápidos: el último reemplaza** al que se estaba mostrando (sin fila de espera), así la pantalla nunca se atrasa respecto del carrito.
    - **Restar o quitar** solo actualiza la lista, sin animación. **Vaciar** (o salir con el carrito cargado) vuelve al logo.
    - **Al cobrar**: "¡Gracias!" **4 s** y logo. El carrito vacío que llega después del cobro no corta el "Gracias"; un producto agregado durante el "Gracias" sí (es el próximo cliente).
    - **Cajas de entrada: como hoy** (logo y "¡Gracias! Bienvenidos a Ibiza" 6 s al cobrar). No muestran el carrito.
    - **La caja manda el carrito entero** (`cliente:carrito`) cada vez que cambia, y la ventana del cliente detecta qué línea creció comparando con el anterior por `varianteId`. `cliente:venta` pasa a no llevar datos: solo dispara el "Gracias".
  - Sub-pasos: **M10a** contrato (`cliente:carrito`, `varianteId` en `LineaCliente`) y la caja manda el carrito al cambiar (hecho, 25/11/2026) · **M10b** `PantallaCliente`: estado nuevo (carrito, destacado, gracias), detectar lo agregado y quitar `pasosDeVenta` (hecho, 25/11/2026) · **M10c** diseño: lista siempre visible, destacado al costado, miniatura de la foto en cada línea y lista larga (que se vean las últimas líneas) (hecho, 25/11/2026) · **M10d** prueba de punta a punta y release (prueba hecha el 26/11/2026; falta el release, junto con M11f).
  - M10a: `useCarritoEnPantallaCliente(lineas, total, activo)` en `PantallaVenta` (activo solo en `BARRA`). Usa `JSON.stringify(aCarritoCliente(...))` como dependencia del efecto: `useCarritoCalculado()` arma objetos nuevos en cada render y sin eso mandaría el evento en cada render.
  - M10b: `PantallaCliente` ya no programa una secuencia: dibuja según tres estados, `aviso` ("gracias" / "entrada", tiene prioridad), `carrito` (con líneas, la venta; vacío, el logo) y `destacado` (`{ varianteId, toque }`). El carrito anterior va en un `useRef` porque los `listen` se registran una sola vez. `lineaAgregada` (en `lib/secuenciaCliente.ts`, que quedó solo con eso y las duraciones) compara por `cantidad`, no por `subTotal`, que cambia con la promo. El destacado se busca en el carrito actual por `varianteId`, así refleja una resta o desaparece si se quita la línea.
  - M10c: con productos no se muestra el logo. Sin producto grande la lista va al centro (hasta 60vw) y al agregar se corre a la derecha (decidido el 25/11/2026). Para que se deslice y no salte, `.venta` tiene siempre dos columnas y la izquierda (`.escena`, siempre presente aunque vacía) pasa de `0fr` a `3fr` con `transition` en `grid-template-columns`. El renglón del producto que está grande se resalta (`.lineaActual`, `--color-acento-suave`). Miniatura: `Foto` recibe `className` y `.miniatura` pisa el tamaño en `em` (escala con la letra de la lista); ocupa las dos filas solo si la línea tiene promo (`.linea:has(.promo)`).

- [ ] **M11** — Cobro con QR de Mercado Pago (agendado el 25/11/2026). Al tocar **Transferencia** se genera un QR dinámico de MP con el total, se muestra en la pantalla del cliente y el ticket sale **cuando MP confirma el pago**.
  - Decidido (25/11/2026):
    - **El medio sigue siendo `TRANSFERENCIA`** (cambio de rumbo 7). No cambian `MEDIOS_PAGO`, `CierreCaja` ni reportes. `Venta` suma **`pagoReferencia`** opcional (id de la orden de MP; `null` en efectivo, tarjeta o transferencia manual). Lo va a usar M12.
    - **El Access Token de MP vive solo en la API** (como `GITHUB_TOKEN`). La caja llama a nuestra API con su token de dispositivo.
    - **Sondeo, sin webhook**: la caja consulta `GET /api/pagos-qr/:ordenId` cada 2 s y la API consulta la orden en MP. El webhook queda como mejora futura.
    - **API de Orders de MP**: `POST /v1/orders` con `type: "qr"`, `config.qr.mode: "dynamic"` y `X-Idempotency-Key`. El QR llega como texto en `type_response.qr_data` y lo dibuja la caja (`qrcode.react`). Vence a los 10 min (`PT10M`).
    - **Una caja (POS) de MP por cada caja nuestra**, `external_id` derivado del id (ej. `IBIZA12`), en una sola sucursal (`MP_STORE_ID`). Si MP responde `pos_not_found`, la API la crea y reintenta una vez.
    - `external_reference = "C{cajaId}-{clave}"` (`clave` = uuid de la caja, también idempotencia). La API comprueba el prefijo: una caja no ve órdenes de otra.
    - **Todas las cajas** (barra y entrada). El QR se ve grande en la pantalla del cliente y más chico en la del cajero (por si no hay segundo monitor).
    - **Cancelar**: cancela la orden en MP y vuelve al carrito. Si MP dice que ya se pagó, se registra la venta: nunca se pierde un pago hecho.
    - **Sin internet o si MP falla**: error + "Reintentar" + **"Confirmar a mano"** (el cajero verifica en el celular). La venta sale como Transferencia sin `pagoReferencia` y con auditoría `TRANSFERENCIA_MANUAL`.
    - Anular una venta pagada por QR **no devuelve la plata en MP** (se hace a mano desde MP).
    - Riesgo aceptado: si se corta la luz con la orden ya pagada y antes de guardar la venta, ese pago queda solo en MP. Avisar al cliente.
  - Sub-pasos: **M11a** cuenta y usuarios de prueba de MP, sucursal, caja y orden probadas a mano con `curl.exe`; variables `MP_ACCESS_TOKEN` y `MP_STORE_ID` (hecho, 25/11/2026) · **M11b** backend: módulo `pagos-qr` (crear, consultar, cancelar) y schemas en `shared` (hecho, 25/11/2026) · **M11c** `pagoReferencia` en la venta (Prisma, `VentaSubidaSchema`, migración 6 de SQLite) y acción `TRANSFERENCIA_MANUAL` (hecho, 25/11/2026) · **M11d** caja: `PantallaCobroQr` (vista `"qr"`) y `useCobrar` con la referencia (en partes: **M11d1** llamadas a la API y `useCobrar` con un objeto `Cobro` (hecho, 25/11/2026) · **M11d2** hook `usePagoQr` (crear, sondear, cancelar), `PantallaCobroQr` con el QR dibujado y vista `"qr"` en `PantallaVenta` (hecho, 25/11/2026) · **M11d3** diseño y casos límite (hecho y probado, 26/11/2026) · **M11e** pantalla del cliente: evento `cliente:qr` y diseño (QR sobre fondo blanco) (hecho y probado, 26/11/2026) · **M11f** prueba de punta a punta, deploy de la API y release de la caja, junto con M10d (prueba en desarrollo y deploy de la API hechos el 26/11/2026; falta el release de la caja).
  - M11a, lo comprobado contra MP (25/11/2026), que manda sobre la documentación cuando no coinciden:
    - El QR viene en **`type_response.qr_data`**. El id de la orden empieza con `ORD` (en prueba, `ORDTST...`).
    - Orden pagada: `status: "processed"`, `status_detail: "accredited"`, con `total_paid_amount`. Otros estados: `created`, `expired`, `canceled`, `refunded`. Solo se cancela en `created`.
    - Caja de MP: `POST /pos` (no `/v2/pos`) con `name`, `store_id`, `external_store_id`, `external_id`, `fixed_amount: true` y `category: 621102`, y `X-Idempotency-Key`. Sucursal: `POST /users/{user_id}/stores`; en prueba, `external_id` `IBIZA`, y la caja `IBIZA1` ya existe.
    - **`MP_STORE_ID` es el id de la sucursal, no el de una caja**: en prueba es `83569139`. Con el id de la caja `IBIZA1` (`141413041`) crear órdenes en `IBIZA1` anda, pero la primera vez que cobra otra caja MP responde `store ... not found` al crear su POS y la API da 502 (pasó el 25/11/2026). Para verlo: `GET /pos?external_id=IBIZA1` devuelve su `store_id`.
    - Pruebas a mano: los JSON y los comandos están en `C:\nova\mp-pruebas\`, fuera del repo. Para pagar se usa la app de MP con el **comprador de prueba**, y el QR se dibuja con `pnpm dlx qrcode -o qr.png "<qr_data>"`.
  - M11b: `apps/api/src/modules/pagos-qr/` (routes + service), montado en `/api/pagos-qr` con `requerirCaja`. Schemas en `packages/shared/src/schemas/pago-qr.ts`: `ESTADOS_PAGO_QR`, `CrearOrdenQrSchema` (`total` entero, `clave` uuid), `OrdenIdSchema` (`^ORD[A-Z0-9]{10,40}$`), `OrdenQrSchema` y `EstadoOrdenQrSchema`.
    - `POST /` → 201 `{ ordenId, qrData, venceEn }`. `GET /:ordenId` y `POST /:ordenId/cancelar` → `{ estado }`. Las rutas usan `consultarOrden`, nunca `buscarOrden` (privada, devuelve la orden cruda de MP).
    - La `clave` va como `X-Idempotency-Key`: el mismo pedido devuelve la misma orden. Ante `pos_not_found` se crea la caja `IBIZA{cajaId}` y se reintenta una vez **con un uuid nuevo** (MP guarda la respuesta de cada clave 24 h).
    - Una caja solo ve sus órdenes: el `external_reference` tiene que empezar con `C{cajaId}-` (el guion evita que la caja 1 vea las de la 12); si no, 404.
    - `cancelarOrden` termina volviendo a consultar: si el cliente pagó justo al cancelar, devuelve `PAGADO`. Un 409 de MP al cancelar no es error.
    - Respuestas de MP con `safeParse` → 502 (con `parse` saldrían como 400). Un `status` desconocido se toma como `PENDIENTE`; `refunded` como `CANCELADO`.
  - M11d2: `usePagoQr` crea la orden con `useQuery` (es idempotente por la `clave`; "Reintentar" reusa la clave, "Generar otro" la cambia) y sondea cada 2 s con `skipToken` hasta salir de `PENDIENTE`. `onPagado` se avisa una sola vez (marca en un `useRef`). `PantallaCobroQr` solo dibuja según `paso`; registrar e imprimir lo sigue haciendo `useCobrar`. En `PantallaVenta`, `pagarCon(medio)`: Transferencia abre la vista `"qr"`, salvo con total $0 (MP no acepta órdenes de $0), que cobra directo.
  - M11e: evento `cliente:qr` con `QrCliente` (`qrData`, `total`) o `null` para sacarlo (`mostrarQr` en `lib/pantallaCliente.ts`). Lo emite un `useEffect` de `PantallaCobroQr` solo en el paso `"esperando"`, y su **limpieza** manda `null`: así cubre todas las salidas (pagado, vencido, cancelado, volver, generar otro, desmontar). En `PantallaCliente` la prioridad es aviso → QR → venta → logo; un QR nuevo corta el destacado y el aviso, pero el `null` **no toca el aviso** (si llegara después del "Gracias" lo cortaría). `PagoQr` (decidido el 26/11/2026): en la barra, la **lista con el TOTAL a la izquierda** (componente `Resumen`, el mismo de la venta) y el **QR a la derecha**, así el cliente ve qué paga mientras escanea; en una caja de entrada (no manda el carrito) va el QR solo con el total arriba. QR de `58vh` sobre `#fff` fijo (el SVG se estira con CSS).
  - M11d3:
    - **Log de MP**: `errorMp(res, accion, cuerpo?)` es `async` y se usa como `throw await errorMp(...)`. Deja en el log (`logger.warn`) la `accion`, el status y hasta 2000 caracteres del cuerpo de MP, sin mandárselo a la caja. Una `Response` se lee una sola vez: en el 404 de crear orden el cuerpo se lee una vez y se pasa como `cuerpo`, y los `res.body?.cancel()` van **después** del chequeo de error. `leerOrden` también loguea los `issues` cuando la respuesta no cumple el schema.
    - **Pagado pero sin guardar**: si falla registrar una venta con `pagoReferencia` o `transferenciaManual`, `useCobrar` no muestra el error genérico: avisa que la plata ya entró ("No vuelvas a cobrar", con el id de la orden) y ofrece reintentar el **mismo** cobro. `preguntarReintento` suma un tercer parámetro para el texto del botón de salida (por defecto "Seguir sin imprimir").
    - **Confirmar a mano cancela el QR primero** (`confirmarManual` de `usePagoQr`, la misma mutación que `cancelar` con destino `"manual"`): si MP dice que ya se pagó, se registra con la referencia; si se canceló o no hay conexión, se cobra a mano igual. Una marca `unaVez` evita registrar dos veces si el sondeo ve `PAGADO` al mismo tiempo.
    - **Cuenta regresiva** "Vence en m:ss" debajo del QR, con `venceEn` (orientativa: la hora sale de la API). Al llegar a 0 la pantalla no cambia sola; cambia cuando el sondeo recibe `VENCIDO`.
- [ ] **M12** — Factura electrónica (agendado el 25/11/2026). Toda venta con **transferencia o débito** sale facturada. Se planifica después de M11. Ojo: hoy no existe "débito" (los medios son Efectivo, Transferencia y Tarjeta): hay que decidir si Tarjeta se separa en débito y crédito. Contradice "Sin facturación fiscal" del cambio de rumbo 6: cuando se planifique, M12 tiene prioridad.

### Observación: qué hace falta para instalar en producción (anotado el 11/11/2026)

Solo para tener en cuenta; **no cambia el orden de la hoja de ruta**. La apertura del boliche está prevista para el **31/12/2026**.

- **Imprescindible antes de instalar**: F14 (primer admin), F15 (crear cajas y usuarios reales), **F25** (updater) y F26 (instalador).
  - F25 tiene que estar en la **primera** instalación: una versión instalada sin updater no se actualiza sola y obligaría a reinstalar a mano en cada PC.
- **Para que el cliente administre solo** (cambiar precios y promos sin depender del desarrollador): F16, F17, F18 y un lugar donde usarlas, F22 (escritorio) o F23 + F24 (web).
- **Puede quedar para después de abrir**: F19 (reportes; las ventas igual quedan en Azure), F20 (si las altas las hace el desarrollador) y F21 (imágenes).
- **Bloquea aunque no sea un paso**: ver "Producción (antes de abrir el boliche)". Además, `CORS_ORIGENES` de producción tiene que incluir `http://tauri.localhost`.
- **Si no da el tiempo**: hacer F14 → F15 → F25 → F26, abrir con la administración por API (Postman o scripts) y sumar las pantallas después.

## Parte 3: cajas de entrada (agendado el 21/11/2026)

En la puerta hay **2 PCs con impresora** que cobran las entradas. Hacen lo mismo que una caja de barra (PIN, fondo, retiros, cambio de cajero, anulación, auditoría, cierre con arqueo ciego, sincronización y updater), pero venden **3 tipos de entrada con precio fijo** en vez de bebidas y comidas. Para retomar: "seguimos con el paso E1".

- Decidido (21/11/2026): **la misma app, el mismo instalador y el mismo release**, no una app aparte. Cada caja tiene un campo `tipo` (`BARRA` / `ENTRADA`, default `BARRA`) que edita el Admin y baja con la sincronización, igual que `aumentoPorcentaje`: la PC sabe qué es por su token. Así no hay dos updaters, dos workflows ni dos SQLite, y una PC se pasa de barra a entrada (o se reemplaza una rota) desde la administración, sin reinstalar. No es un ajuste local: lo decide el Admin desde la nube.
- Decidido (21/11/2026): las entradas usan **el modelo que ya existe**, como la comida en M1. `SECCIONES` suma `ENTRADA`; categoría "Entradas" con sección `ENTRADA`; cada tipo de entrada es un Producto con una sola Variante en envase "Unidad". Venta, ítems, subida, anulación, cierre, promos y reportes no cambian. `SECCIONES_POR_TIPO` en `shared`: `BARRA → [BEBIDA, COMIDA]`, `ENTRADA → [ENTRADA]`.
- Decidido (21/11/2026): **un ticket por persona**. 3 entradas = 3 tickets ("1/3", "2/3", "3/3") con corte entre cada uno; cada uno con letra de la semana, fecha, caja, número de venta, tipo de entrada, precio, medio de pago y hora. **Precio fijo** por tipo, sin cambios por horario (si algún día hace falta, alcanza con una promo con horario).

- [x] **E1** — Backend: `tipo` en `Caja`, migración, `TIPOS_CAJA` y `SECCIONES_POR_TIPO` en `shared`, `ENTRADA` en `SECCIONES`, schema Zod, servicio de cajas y bajada (la fila `caja` ya viene siempre) (hecho, 21/11/2026).
  - `packages/shared/src/tipo-caja.ts`: `TIPOS_CAJA`, `TipoCaja`, `NOMBRE_TIPO_CAJA` y `SECCIONES_POR_TIPO` (el orden importa: la primera sección es la pestaña inicial). Migración `tipo_caja`: `NVARCHAR(10) NOT NULL DEFAULT 'BARRA'`.
  - `tipo` en `CajaInputSchema` es solo `.optional()`, **sin `.default()`**: `CajaUpdateSchema` reutiliza el shape y un default haría que cualquier edición sin `tipo` pase la caja a `BARRA`. El default de "crear" lo pone la base.
  - **Prisma 7: `db:migrate` no regenera el cliente.** Después de cada cambio en `schema.prisma` hay que correr también `pnpm --filter @ibiza/api db:generate` (y reiniciar `pnpm dev` y, si hace falta, el TS Server de VS Code).
- [x] **E2** — Caja: guardar el tipo igual que `aumentoPorcentaje` (`apps/caja/src/db/ajustes.ts`) (hecho, 21/11/2026).
  - **Sin migración 6**: el tipo va en la tabla clave/valor `Ajustes` (clave `tipoCaja`) y `aplicarCambios` guarda la fila `caja` en cada bajada, así que llega en la primera sincronización sin volver `versionCatalogo` a 0. `leerTipoCaja()` valida el texto con un _type guard_ y, si no hay valor, devuelve `"BARRA"`.
  - De paso se arregló un bug de la subida: `CierreSubidaSchema` exigía `esperado >= 0`, un cierre con esperado negativo daba 400 y trababa toda la cola. Ahora acepta negativos.
- [x] **E3** — Caja: la venta muestra solo las secciones de su tipo (sin pestañas en una caja de entrada; `PantallaVenta.tsx` ya filtra `SECCIONES` por las categorías que existen) y el encabezado indica que es caja de entrada.
- [x] **E4** — Ticket de entrada en Rust: comando nuevo junto a `imprimir_ticket` (`ticket.rs` y `lib/impresora.ts`) que imprime un ticket por unidad con "n/N" y corte.
- [x] **E5** — Administración: campo "Tipo" en `admin/cajas/Cajas.tsx` y sección "Entradas" en `admin/catalogo/Categorias.tsx` (usa `NOMBRE_SECCION`). Reportes: separar entradas de barra (por sección o por tipo de caja) (hecho, 23/11/2026).
  - Reportes: se separa **por tipo de caja**. `ventasPorCaja` devuelve `tipo` en cada caja y un arreglo `tipos` con los totales; `VentasPorCaja.tsx` muestra la columna Tipo y la tabla "Por tipo de caja" solo si hay alguna caja de entrada.
  - `Categorias.tsx` no se tocó: arma las opciones desde `SECCIONES`, así que "Entradas" aparece sola.
  - Cargar entradas: envase "Unidad" → categoría "Entradas" (sección Entrada) → un producto por tipo de entrada → una sola variante con envase Unidad y su precio. Cuidar que ninguna promo las alcance y dejar el aumento en 0 en las cajas de entrada.
- [x] **E6** — Prueba de punta a punta y release de la caja.

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

- **Logo**: los PNG de `packages/ui/src/assets/` y `apps/caja/src-tauri/icons/icono-fuente.png` son provisorios, recortados de una foto de WhatsApp. Pedir al cliente el original (PNG transparente o SVG) y reemplazarlos con los mismos nombres; después correr `pnpm tauri icon src-tauri/icons/icono-fuente.png` en `apps/caja` y borrar `android/`, `ios/` y `64x64.png`.
- Recomendar equipamiento para comprar (PCs táctiles, impresoras, UPS, cajones) y conseguir una impresora para probar.
- Confirmar horario de corte de la jornada (propuesta 18:00 a 10:00).
- Diseño de la pantalla de cobro.
- Avisarle al cliente que Mercado Pago va dentro de Transferencia (en la reunión del 31/10 se había hablado de botones separados).
- Consumiciones: ¿cómo llegan a la barra (vale/pulsera/entrada)? ¿Quién las autoriza? ¿Hay tope por persona? ¿Se cuentan aparte en el cierre?
- ¿En Efectivo se muestra "paga con" y vuelto (montos rápidos en botones)?
- ¿Cómo se maneja SmartScreen sin certificado de firma de código? (se ve en F26). Lo demás del updater quedó resuelto en F25: obligatoria solo con la caja cerrada, y los releases del repo privado pasan por la API.
- Entradas (Parte 3): ¿alguna incluye consumición (un vale para canjear en la barra)? Consultar al cliente.
- Entradas (Parte 3): al anular una venta de varias entradas, por defecto se anula la venta completa y hay que recuperar todos los tickets (misma regla que en la barra). Confirmar con el cliente.
- Entradas (Parte 3): nombres y precios de los 3 tipos de entrada.
- Retiros: hoy la caja deja retirar más efectivo del que hay (pasó el 20/11: fondo $20.000, retiro $150.000, esperado −$130.000). ¿Se limita? Ojo: avisar "no hay tanto efectivo" le revela el esperado al cajero y choca con el arqueo ciego. Igual el esperado puede quedar negativo sin error (retiro y después anulación de una venta en efectivo), por eso `CierreSubidaSchema` acepta `esperado` negativo desde el 21/11/2026.

### Producción (antes de abrir el boliche)

- **Primer admin**: resuelto (12/11/2026). Se creó con `apps/api/src/scripts/crear-admin.ts`, corrido desde la consola SSH del App Service (`node dist/scripts/crear-admin.js` con `ADMIN_NOMBRE`, `ADMIN_PIN`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`). El script se niega si ya hay un admin con acceso al panel. El seed sigue sin correrse en producción.
- **Azure SQL**: hoy usa la oferta gratis; al agotarse el límite, la base se pausa hasta el mes siguiente. Pasarla a paga antes de operar.
- **App Service**: confirmar que `novatech-plan-br` alcance (lo comparte con otras apps) y tenga Always On.
- **`CORS_ORIGENES`**: resuelto (18/11/2026). Tiene la URL del panel, `http://tauri.localhost` y la de la propia API (esta última sobra pero no molesta). El CORS de plataforma del App Service queda vacío para que decida Express.
- **Recuperar la contraseña del panel**: `apps/api/src/scripts/resetear-password.ts`, por SSH en el App Service (`cd /home/site/wwwroot`, `read -s ADMIN_PASSWORD && export ADMIN_PASSWORD`, `ADMIN_EMAIL=... node dist/scripts/resetear-password.js`). Pisa la contraseña de un `AccesoPanel` existente y deja `RESET_PASSWORD` en la auditoría. En desarrollo: `pnpm --filter @ibiza/api admin:password`.
- **`GITHUB_TOKEN` en el App Service**: resuelto (19/11/2026). Cargado en _Environment variables_; `/api/actualizaciones` probado contra Azure. Si se regenera el token en GitHub, hay que actualizarlo ahí y en `apps/api/.env` (es obligatorio: sin él la API no arranca).
- **Mercado Pago (M11)**: hoy se usan credenciales de prueba (la cuenta de desarrollador es del desarrollador). Antes de abrir, pasar a las de la cuenta del boliche: crear la sucursal real y cargar `MP_ACCESS_TOKEN` y `MP_STORE_ID` en el App Service (son obligatorias: sin ellas la API no arranca).
  - Decidido (25/11/2026): **la aplicación de MP se crea en la cuenta del dueño**, no OAuth (OAuth solo convendría si el sistema se vende a otros boliches). El dueño crea la aplicación en su panel de desarrolladores, activa las credenciales de producción y pasa el Access Token (`APP_USR-...`), que va **solo** en el App Service. El código no cambia: desarrollo sigue con la cuenta de prueba del desarrollador.
  - Con ese token se crea la sucursal en su cuenta (`POST /users/{user_id}/stores` con el `user_id` del dueño) → `MP_STORE_ID`. Las cajas `IBIZA{cajaId}` las crea sola la API (`pos_not_found`). La sucursal `IBIZA` y la caja `IBIZA1` de M11a son de la cuenta de prueba y no sirven en producción.
  - Avisarle al dueño: el Access Token da acceso total a su cuenta (cobrar, ver movimientos, devolver). Si dejan de trabajar juntos, lo renueva desde su panel y el viejo deja de andar.
- **Application Insights**: previsto en el stack, todavía sin activar.
- **Clave de la letra de la semana**: en producción vive en la variable `CLAVE_LETRA` del App Service (cargada el 12/11/2026, distinta de la de desarrollo). Si se cambia, cambian las letras de los tickets.
