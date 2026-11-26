-- Id de la orden de Mercado Pago cuando la venta se cobró con QR (M11).
-- NULL en efectivo, tarjeta o transferencia confirmada a mano; las ventas
-- que ya están en la base quedan en NULL.
-- No se vuelve versionCatalogo a 0: Venta es una operación (sube a la nube),
-- no baja con el catálogo.
ALTER TABLE Venta ADD COLUMN pagoReferencia TEXT;
