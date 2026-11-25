import type { CarritoCliente, LineaCliente } from "./pantallaCliente";

export const DURACION_ENTRADA = 6000;
export const DURACION_GRACIAS = 4000;
export const DURACION_DESTACADO = 1500;

export const CARRITO_VACIO: CarritoCliente = { lineas: [], total: 0 };

// La línea que creció entre un carrito y el siguiente (una línea nueva crece desde 0).
// Restar, quitar o un cambio de precio por promo no cuentan: devuelve null.
export const lineaAgregada = (
  anterior: CarritoCliente,
  nuevo: CarritoCliente,
): LineaCliente | null => {
  const antes = new Map(anterior.lineas.map((l) => [l.varianteId, l.cantidad]));
  return nuevo.lineas.find((l) => l.cantidad > (antes.get(l.varianteId) ?? 0)) ?? null;
};
