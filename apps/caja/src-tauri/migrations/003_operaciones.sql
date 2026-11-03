CREATE TABLE AperturaCaja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cajeroId INTEGER NOT NULL,
    encargadoId INTEGER NOT NULL,
    fondo INTEGER NOT NULL,
    jornadaFecha TEXT,
    jornadaLetra TEXT,
    ocurridaEn TEXT NOT NULL
) STRICT;

CREATE TABLE Venta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aperturaId INTEGER NOT NULL REFERENCES AperturaCaja (id),
    numero INTEGER NOT NULL,
    cajeroId INTEGER NOT NULL,
    medioPago TEXT NOT NULL,
    subTotal INTEGER NOT NULL,
    descuento INTEGER NOT NULL,
    total INTEGER NOT NULL,
    ocurridaEn TEXT NOT NULL,
    UNIQUE (aperturaId, numero)
) STRICT;

CREATE TABLE ItemVenta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ventaId INTEGER NOT NULL REFERENCES Venta (id),
    varianteId INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    precioUnitario INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    promocionId INTEGER,
    promocionNombre TEXT,
    descuento INTEGER NOT NULL DEFAULT 0
) STRICT;

CREATE INDEX ItemVenta_ventaId ON ItemVenta (ventaId);

CREATE TABLE Anulacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ventaId INTEGER NOT NULL UNIQUE REFERENCES Venta (id),
    encargadoId INTEGER NOT NULL,
    motivo TEXT NOT NULL,
    ocurridaEn TEXT NOT NULL
) STRICT;

CREATE TABLE MovimientoCaja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aperturaId INTEGER NOT NULL REFERENCES AperturaCaja (id),
    tipo TEXT NOT NULL,
    monto INTEGER NOT NULL,
    motivo TEXT,
    usuarioId INTEGER NOT NULL,
    autorizoId INTEGER,
    ocurridaEn TEXT NOT NULL
) STRICT;

CREATE INDEX MovimientoCaja_aperturaId ON MovimientoCaja (aperturaId);

CREATE TABLE CierreCaja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aperturaId INTEGER NOT NULL UNIQUE REFERENCES AperturaCaja (id),
    cerradoPorId INTEGER NOT NULL,
    contado INTEGER NOT NULL,
    esperado INTEGER NOT NULL,
    diferencia INTEGER NOT NULL,
    totalTarjeta INTEGER NOT NULL,
    totalTransferencia INTEGER NOT NULL,
    pendiente INTEGER NOT NULL DEFAULT 0,
    ocurridaEn TEXT NOT NULL
) STRICT;

CREATE TABLE AuditoriaCaja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuarioId INTEGER,
    accion TEXT NOT NULL,
    detalle TEXT,
    ocurridaEn TEXT NOT NULL
) STRICT;

-- tipo + idLocal apuntan a la operación; el id da el orden de envío
CREATE TABLE ColaSync (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    idLocal INTEGER NOT NULL,
    creadaEn TEXT NOT NULL,
    enviadaEn TEXT,
    intentos INTEGER NOT NULL DEFAULT 0,
    ultimoError TEXT,
    UNIQUE (tipo, idLocal)
) STRICT;

CREATE INDEX ColaSync_pendientes ON ColaSync (id) WHERE enviadaEn IS NULL;