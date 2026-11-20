-- En qué pestaña de la venta aparece la categoría (M1).
-- NOT NULL con DEFAULT: las categorías que ya están en la base quedan como BEBIDA.
-- Sin CHECK: los valores válidos los controla Zod en la API, y en SQLite un CHECK
-- no se puede cambiar después sin rehacer la tabla (si se suma una sección).
ALTER TABLE Categoria ADD COLUMN seccion TEXT NOT NULL DEFAULT 'BEBIDA';

-- La bajada solo trae lo que cambió desde la versión guardada, y las categorías
-- de comida que ya existen en la nube no cambiaron. Volviendo a 0, la próxima
-- bajada trae todo el catálogo de nuevo, ya con su sección.
UPDATE Ajustes SET valor = '0' WHERE clave = 'versionCatalogo';
