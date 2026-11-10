export const ACCIONES_AUDITORIA = [
    "INGRESO", "SALIDA", "RETIRO", "ANULACION", "CONFIG_IMPRESORA"
] as const ;

export type AccionAuditoria = (typeof  ACCIONES_AUDITORIA)[number];


