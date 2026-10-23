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

| Permiso | Cajero | Encargado | Admin/Dueño |
|---|---|---|---|
| Vender | ✓ | ✓ | ✓ |
| Anular venta | — | ✓ | ✓ |
| Retirar efectivo | — | ✓ | ✓ |
| Cambiar precios | — | ✓ | ✓ |
| Crear/pausar promos | — | ✓ | ✓ |
| Crear usuarios y cajas | — | — | ✓ |
| Ver reportes | — | — | ✓ (online) |

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

- **IDs UUID v7** (las cajas los generan offline sin chocar).
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
2. **Operaciones suben** (bandeja de salida): la venta y su entrada en la cola se guardan en la misma transacción; se mandan lotes de ~50; la nube inserta solo si el UUID no existe (idempotente) y confirma; reintentos con espera creciente. Orden: apertura → ventas y movimientos → cierre.
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
- [ ] **Paso 4** — Prisma 7 + SQL Server local: preparar SQL Server (TCP/IP, autenticación SQL, login y base), `prisma.config.ts`, cliente con adapter en `src/db/prisma.ts`, primer modelo `Caja`, primera migración, ruta `/health/db`.
- [ ] **Paso 5** — Schema completo de Prisma con todos los modelos, relaciones, índices y versión global.
- [ ] **Paso 6** — Paquete `packages/shared`: enums, constantes, schemas Zod y tipos compartidos; usarlo desde la API.
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

## Pendientes y preguntas abiertas

- Integración con Mercado Pago (consultar al cliente).
- Modelo de impresora térmica (conseguir una y probar).
- Prisma vs Drizzle para el SQLite de las cajas.
- Horario exacto de corte de la jornada.
- Diseño de la pantalla de cobro.
