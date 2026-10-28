export const TIPOS_MOVIMIENTO = ["FONDO", "RETIRO", "CONTEO_PARCIAL"] as const;
export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number]; 
