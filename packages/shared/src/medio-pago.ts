export const MEDIOS_PAGO = ["EFECTIVO", "TRANSFERENCIA", "TARJETA"] as const;
export type MedioPago = (typeof MEDIOS_PAGO)[number];