-- Nullable: no todos los productos tienen foto
ALTER TABLE Producto ADD COLUMN imagenUrl TEXT;

-- Los productos que ya estaban en la base no traen su imagenUrl, y la bajada
-- solo pide lo que cambió desde la versión guardada. Volviendo a 0, la próxima
-- bajada trae todo el catálogo de nuevo (con INSERT OR REPLACE, sin borrar nada).
UPDATE Ajustes SET valor = '0' WHERE clave = 'versionCatalogo';
