CREATE TABLE Envase (
    id Integer PRIMARY KEY,
    nombre TEXT NOT NULL,
    orden INTEGER NOT NULL,
    activo INTEGER NOT NULL
) STRICT;

CREATE TABLE Categoria (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    orden INTEGER NOT NULL,
    activo INTEGER NOT NULL
) STRICT;

CREATE TABLE Producto (
    id INTEGER PRIMARY KEY,
    categoriaId INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    orden INTEGER NOT NULL,
    activo INTEGER NOT NULL
) STRICT;

CREATE TABLE Variante (
    id INTEGER PRIMARY KEY,
    productoId INTEGER NOT NULL,
    envaseId INTEGER NOT NULL,
    precio INTEGER NOT NULL,
    activo INTEGER NOT NULL
) STRICT;

CREATE TABLE Promocion (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL,
    llevar INTEGER,
    pagar INTEGER,
    porcentaje INTEGER,
    monto INTEGER,
    dias TEXT NOT NULL,
    horaDesde TEXT,
    horaHasta TEXT,
    pausada INTEGER NOT NULL,
    activo INTEGER NOT NULL
) STRICT;

CREATE TABLE PromocionAlcance (
    id INTEGER PRIMARY KEY,
    promocionId INTEGER NOT NULL,
    productoId INTEGER,
    categoriaId INTEGER,
    activo INTEGER NOT NULL
) STRICT;

CREATE TABLE PromocionEnvase (
    id INTEGER PRIMARY KEY,
    promocionId INTEGER NOT NULL,
    envaseId INTEGER NOT NULL,
    activo INTEGER NOT NULL
) STRICT;

-- pinHash baja de la nube porque el PIN se valida acá, sin internet
CREATE TABLE Usuario (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL,
    pinHash TEXT NOT NULL,
    activo INTEGER NOT NULL
) STRICT;