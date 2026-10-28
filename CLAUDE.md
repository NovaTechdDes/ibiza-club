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
- [ ] **Paso 7** — Estructura de módulos (`src/modules/`), middleware de validación con Zod y manejo central de errores.
- [ ] **Paso 8** — Seed de datos de prueba (cajas, usuarios, catálogo, promos).
- [ ] **Paso 9** — Módulo catálogo: CRUD de categorías, productos, envases, variantes y promos (sube la versión global y registra auditoría).
- [ ] **Paso 10** — Autenticación: login del panel (admin, JWT) y token de dispositivo por caja.
- [ ] **Paso 11** — Endpoint de sincronización de bajada (cambios desde versión X).
- [ ] **Paso 12** — Endpoint de sincronización de subida (lotes idempotentes de operaciones, orden de dependencias).
- [ ] **Paso 13** — Lógica de promos y letra de la semana en `shared`, con tests (Vitest).
- [ ] **Paso 14** — Endpoints de reportes (ventas por jornada, caja, medio de pago, promos, arqueos, estado de sincronización por caja).
- [ ] **Paso 15** — Seguridad y operación: CORS, helmet, rate limit, logs estructurados.
- [ ] **Paso 16** — Deploy en Azure: App Service, Azure SQL serverless, variables de entorno, migraciones en producción.

Después del backend: app de escritorio (Electron + SQLite + impresión + sincronización), pantalla de cobro y panel web del dueño.

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

## Pendientes y preguntas abiertas

- Integración con Mercado Pago (consultar al cliente).
- Modelo de impresora térmica (conseguir una y probar).
- Prisma vs Drizzle para el SQLite de las cajas.
- Horario exacto de corte de la jornada.
- Diseño de la pantalla de cobro.
- ¿"Tarjeta" incluye Mercado Pago/QR o va como botón aparte? (hoy `CierreCaja` tiene `totalMercadoPago`, habría que renombrarlo según la respuesta).
- ¿En Efectivo se muestra "paga con" y vuelto (montos rápidos en botones)?
- Cuántas cajas hay y cómo están repartidas por barra; si el dinero de una barra con varias PCs se cuenta junto o por separado.
- ¿El cliente quiere el paso de abrir jornada? (modo opcional, ver Cambios de rumbo 1).
- Updater: ¿actualización obligatoria u opcional? ¿Repo público o privado? ¿Cómo se maneja SmartScreen sin certificado?
