export const DIAS_PROMOCION = ["VIERNES", "SABADO", "AMBOS"] as const;
export type DiaPromocion = (typeof DIAS_PROMOCION)[number];
