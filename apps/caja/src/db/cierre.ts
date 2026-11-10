
import { sentenciasAuditoria } from "./auditoria";
import { obtenerDb, transaccion } from "./conexion";

export type ResumenCierre = {
    fondo: number;
    efectivo: number; 
    tarjeta: number; 
    transferencia: number; 
    retiros: number;
    esperado: number;
    cantVentas: number;
    cantAnuladas: number
};

type FilaVentas = {
    efectivo: number; tarjeta: number; transferencia: number;
    cantVentas: number; cantAnuladas: number;
}

type NuevoCierre = {
    aperturaId: number;
    cerradoPorId: number;
    contado: number;
    pendiente: boolean
};
export type ResultadoCierre = ResumenCierre & {contado: number; diferencia: number }

export const calcularResumen = async(aperturaId: number): Promise<ResumenCierre> => {
    const db = await obtenerDb();

    const [apertura] = await db.select<{fondo: number}[]>(
        `SELECT fondo FROM AperturaCaja WHERE id = $1`,[aperturaId]
    )

    if(!apertura) throw new Error(`La apertura ${aperturaId} no existe`);

    const [ventas] = await db.select<FilaVentas[]>(
        `SELECT
            COALESCE(SUM(CASE WHEN an.id IS NULL AND v.medioPago = 'EFECTIVO'      THEN v.total END), 0) AS efectivo,
            COALESCE(SUM(CASE WHEN an.id IS NULL AND v.medioPago = 'TARJETA'       THEN v.total END), 0) AS tarjeta,
            COALESCE(SUM(CASE WHEN an.id IS NULL AND v.medioPago = 'TRANSFERENCIA' THEN v.total END), 0) AS transferencia,
            COALESCE(SUM(CASE WHEN an.id IS NULL THEN 1 ELSE 0 END), 0) AS cantVentas,
            COUNT(an.id) AS cantAnuladas
            FROM Venta v
            LEFT JOIN Anulacion an ON an.ventaId = v.id
            WHERE v.aperturaId = $1`,
        [aperturaId]
    )

    const [filasRetiros] = await db.select<{retiros: number}[]>(
        `
            SELECT COALESCE(SUM(monto), 0) as retiros FROM MovimientoCaja WHERE aperturaId = $1 AND tipo = 'RETIRO'
        `,
        [aperturaId]
    
    )
    const retiros = filasRetiros?.retiros ?? 0;
    const efectivo = ventas?.efectivo ?? 0;
    const esperado = apertura.fondo + efectivo - retiros

    return {
        fondo: apertura.fondo, efectivo,
        tarjeta: ventas?.tarjeta ?? 0,
        transferencia: ventas?.transferencia ?? 0,
        retiros, esperado,
        cantVentas: ventas?.cantVentas ?? 0,
        cantAnuladas: ventas?.cantAnuladas ?? 0
    }
};

export const cerrarCaja = async({aperturaId, cerradoPorId, contado, pendiente}: NuevoCierre): Promise<ResultadoCierre> => {

    if(!Number.isInteger(contado) || contado < 0) throw new Error('Monto contado invalido')

    const resumen = await calcularResumen(aperturaId);
    const diferencia = contado - resumen.esperado;
    const ahora = new Date().toISOString();

    await transaccion([
        {
            sql: `INSERT INTO CierreCaja (aperturaId, cerradoPorId, contado, esperado, diferencia, totalTarjeta, totalTransferencia, pendiente, ocurridaEn)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            valores: [aperturaId, cerradoPorId, contado, resumen.esperado, diferencia, resumen.tarjeta, resumen.transferencia, pendiente ? 1 : 0, ahora]
        },
        {
            sql: `INSERT INTO ColaSync (tipo, idLocal, creadaEn) VALUES ('CIERRE', last_insert_rowid(), $1)`,
            valores: [ahora]
        },
        ...(sentenciasAuditoria({accion: 'CIERRE', usuarioId: cerradoPorId, detalle: {
            contado, esperado: resumen.esperado, diferencia, pendiente
        }}, ahora))
    ])

    return {
        ...resumen, contado, diferencia
    }
}