export const MEDIOS_PAGO = ["EFECTIVO", "TRANSFERENCIA", "TARJETA"] as const;
export type MedioPago = (typeof MEDIOS_PAGO)[number];

// Record obliga a tener un nombre para cada medio: si se agrega uno, TS avisa acá
export const NOMBRE_MEDIO: Record<MedioPago, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
};