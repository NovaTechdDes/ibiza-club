export const TIPOS_PROMOCION = ["NXM", "PORCENTAJE", "MONTO_FIJO"] as const;
export type TipoPromocion = (typeof TIPOS_PROMOCION)[number];
