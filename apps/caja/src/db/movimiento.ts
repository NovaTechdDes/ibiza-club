import { TipoMovimiento } from "@ibiza/shared";
import { obtenerDb, transaccion } from "./conexion";
import { sentenciasAuditoria } from "./auditoria";

type NuevoMovimiento = {
    aperturaId: number;
    tipo: TipoMovimiento;
    monto: number;
    motivo: string | null;
    usuarioId: number;
    autorizoId: number | null
};


// Sirve para retiros y conteos parciales: misma tabla misma cola
export const registrarMovimiento = async(movimiento: NuevoMovimiento) => {
    const db = await obtenerDb();
    const { aperturaId, tipo, monto, motivo, usuarioId, autorizoId} = movimiento;

    if(!Number.isInteger(monto) || monto < 0) throw new Error("monto invalido");
    if (tipo === "RETIRO" && monto === 0) throw new Error('El retiro tiene que ser mayor a 0');
    if (tipo === "RETIRO" && (!motivo || !autorizoId)){
        throw new Error("El retiro necesita motivo y quien lo autoriza");
    }

    const ahora = new Date().toISOString();

    await transaccion([
        {
            sql: `INSERT INTO MovimientoCaja (aperturaID, tipo, monto, motivo, usuarioID, autorizoId, ocurridaEn)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, valores: [aperturaId, tipo, monto, motivo, usuarioId, autorizoId, ahora]
        },
        {
            sql: `INSERT INTO ColaSync (tipo, idLocal, creadaEn) VALUES ('MOVIMIENTO', last_insert_rowid(), $1)`,
            valores: [ahora]
        },
        ...(tipo === "RETIRO" ? sentenciasAuditoria({ accion: 'RETIRO', usuarioId: autorizoId, detalle: {monto, motivo, cajeroId: usuarioId}}, ahora) : [])
    ])

    const [fila]  = await db.select<{id: number}[]>(
        `SELECT MAX(id) as id FROM MovimientoCaja`
    );

    return {
        id: fila?.id ?? 0, ocurridaEn: ahora
    }
}