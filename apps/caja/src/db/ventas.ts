import { LineaCalculada, MedioPago } from "@ibiza/shared";
import { obtenerDb, Sentencia, transaccion } from "./conexion";

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
    const { aperturaId, cajeroId, medioPago, lineas, subTotal, descuento, total} = venta;

    if (lineas.length === 0) throw new Error('El carrito esta vacio');
    const numero = await siguienteNumero(aperturaId);
    const ahora = new Date().toISOString();

    const sentencias: Sentencia[] = [
        {
            sql: `INSERT INTO Venta (aperturaId, numero, cajeroId, medioPago, subTotal, descuento, total, ocurridaEn) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, valores: [aperturaId, numero, cajeroId, medioPago, subTotal, descuento, total,ahora]
        },
        {
            sql: `INSERT INTO ColaSync (tipo, idLocal, creadaEn) VALUES ('VENTA', last_insert_rowid(), $1)`,
            valores: [ahora]
        },
        ...lineas.map((linea) => ({
            sql: `INSERT INTO ItemVenta (ventaId, varianteId, nombre, precioUnitario, cantidad, promocionId, promocionNombre, descuento) VALUES ((SELECT id FROM Venta WHERE aperturaId = $1 AND numero = $2), $3, $4, $5, $6, $7, $8, $9)`, valores: [aperturaId, numero, linea.varianteId, `${linea.nombre} (${linea.envaseNombre})`, linea.precio, linea.cantidad, linea.promocionId, linea.promocionNombre, linea.descuento]
        }))
    ];
    await transaccion(sentencias);
    return numero;
}