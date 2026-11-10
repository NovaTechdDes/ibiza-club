import type { AccionAuditoria } from "@ibiza/shared"
import { transaccion, type Sentencia } from "./conexion";
import { avisarOperacionNueva } from "../hooks/useSubida";
import { queryClient } from "../lib/queryClient";

type NuevaAuditoria = {
    accion: AccionAuditoria,
    usuarioId: number | null;
    detalle?: Record<string, unknown>
};

// Devuelve sentencias para sumarlas a la transaccion de la operacion
export const sentenciasAuditoria = (
    {accion, usuarioId, detalle}: NuevaAuditoria,
     ahora: string,
    ): Sentencia[] => [
        {
            sql: `INSERT INTO AuditoriaCaja (usuarioId, accion, detalle, ocurridaEn)
            VALUES ($1, $2, $3, $4)`,
            valores: [usuarioId, accion, detalle ? JSON.stringify(detalle) : null, ahora]
        },
        {
            sql: `INSERT INTO ColaSync (tipo, idLocal, creadaEn)
            VALUES ('AUDITORIA', last_insert_rowid(), $1)`,
            valores: [ahora]
        }
    ];

// Para acciones que no tienen otra operación (ingreso, salida, impresora)
export const registrarAuditoria = async (a: NuevaAuditoria) => {
    await transaccion(sentenciasAuditoria(a, new Date().toISOString()));
    // Recién guardada: así el indicador y la subida la ven enseguida
    avisarOperacionNueva(queryClient);
};
