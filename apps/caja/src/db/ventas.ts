import { LineaCalculada, MedioPago } from "@ibiza/shared";
import { obtenerDb, Sentencia, transaccion } from "./conexion";
import { sentenciasAuditoria } from "./auditoria";
import { subtotal } from "../lib/descartes";
import { ItemQuitado } from "../stores/carrito";

type LineaACobrar = LineaCalculada & {
    nombre: string;
    envaseNombre: string;
};

type NuevaVenta = {
    aperturaId: number;
    cajeroId: number;
    medioPago: MedioPago;
    lineas: LineaACobrar[];
    subTotal: number;
    descuento: number;
    total: number;
    quitados: ItemQuitado[];
    pagoReferencia?: string | null;
    transferenciaManual?: boolean;
};


const siguienteNumero = async (aperturaId: number) => {
    const db = await obtenerDb();
    const filas = await db.select<{ultimo: number | null}[]>(
        "SELECT Max(numero) as ultimo FROM Venta WHERE aperturaId = $1", [aperturaId]
    );
    return (filas[0]?.ultimo ?? 0) + 1;
};


// Devuelve el numero porque el tickcet lo va necesitar en f10
export const registrarVenta = async (venta: NuevaVenta) => {
    const {
        aperturaId, cajeroId, medioPago, lineas, subTotal, descuento, total, quitados,
        pagoReferencia = null, transferenciaManual = false
    } = venta;

    if (lineas.length === 0) throw new Error('El carrito esta vacio');
    if((pagoReferencia || transferenciaManual) && medioPago !== 'TRANSFERENCIA'){
        throw new Error("solo una transferencia lleva referencia de pago")
    }
    if(pagoReferencia && transferenciaManual){
        throw new Error("Una venta con referencia de pago no es manual")
    }
    const numero = await siguienteNumero(aperturaId);
    const ahora = new Date().toISOString();

    const sentencias: Sentencia[] = [
        {
            sql: `INSERT INTO Venta
             (aperturaId, numero, cajeroId, medioPago, subTotal, descuento, total, ocurridaEn, pagoReferencia)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              valores: [aperturaId, numero, cajeroId, medioPago, subTotal, descuento, total, ahora, pagoReferencia]
        },
        {
            sql: `INSERT INTO ColaSync (tipo, idLocal, creadaEn) VALUES ('VENTA', last_insert_rowid(), $1)`,
            valores: [ahora]
        },
        ...lineas.map((linea) => ({
            sql: `INSERT INTO ItemVenta (ventaId, varianteId, nombre, precioUnitario, cantidad, promocionId, promocionNombre, descuento) VALUES ((SELECT id FROM Venta WHERE aperturaId = $1 AND numero = $2), $3, $4, $5, $6, $7, $8, $9)`, valores: [aperturaId, numero, linea.varianteId, `${linea.nombre} (${linea.envaseNombre})`, linea.precio, linea.cantidad, linea.promocionId, linea.promocionNombre, linea.descuento]
        })),
        ...(quitados.length > 0
            ? sentenciasAuditoria({
                accion: "ITEMS_QUITADOS",
                usuarioId: cajeroId,
                detalle: {numero, quitados, total: subtotal(quitados)}
            }, ahora)
            : []),
        ...(transferenciaManual
            ? sentenciasAuditoria({
                accion: "TRANSFERENCIA_MANUAL",
                usuarioId: cajeroId,
                detalle: { numero, total}
            }, ahora)
            : [])
    ];
    await transaccion(sentencias);
    return numero;
}