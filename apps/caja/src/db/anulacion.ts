import { MedioPago } from "@ibiza/shared";
import { obtenerDb, transaccion } from "./conexion";
import { sentenciasAuditoria } from "./auditoria";

type FilaVenta = {
    id: number; numero: number; total: number;
    medioPago: MedioPago; ocurridaEn: string;
    anulada: number
};

export type VentaParaAnular = Omit<FilaVenta, "anulada"> & {
    anulada: boolean;
    items: { nombre: string, cantidad: number}[]
};

export const buscarVentaParaAnular = async (
    aperturaId: number, numero: number
): Promise<VentaParaAnular | null> => {
    const db = await obtenerDb();
    const [v ] =await db.select<FilaVenta[]>(
        `SELECT v.id, v.numero, v.total, v.medioPago, v.ocurridaEn, 
            (a.id IS NOT NULL) AS anulada
        FROM Venta v LEFT JOIN Anulacion a ON a.ventaId = v.id
        WHERE v.aperturaId = $1 AND v.numero = $2`,
        [aperturaId, numero],
)
    if(!v) return null;
    const items = await db.select<{nombre: string; cantidad: number }[]>(
        `SELECT nombre, cantidad FROM ItemVenta WHERE ventaId = $1`, [v.id]
    );
    return {...v, anulada: v.anulada === 1, items}
};

type NuevaAnulacion = {
    ventaId: number; numero: number; total: number;
    motivo: string; encargadoId: number; cajeroId: number
};

export const registrarAnulacion = async(a: NuevaAnulacion) => {
    if (!a.motivo.trim()) throw new Error("La anulacion necesita motivo");
    const ahora = new Date().toISOString();
    await transaccion([
    {
        sql: `INSERT INTO Anulacion (ventaId, encargadoId, motivo, ocurridaEn) VALUES ($1, $2, $3, $4)`,
        valores: [a.ventaId, a.encargadoId, a.motivo, ahora]
    },
    {
        sql: `INSERT INTO ColaSync (tipo, idLocal, creadaEn) VALUES ('ANULACION', last_insert_rowid(), $1)`,
        valores: [ahora]
    },
    ...sentenciasAuditoria({
        accion: 'ANULACION',
        usuarioId: a.encargadoId,
        detalle: { ventaId: a.ventaId, numero: a.numero, total: a.total, motivo: a.motivo, cajeroId: a.cajeroId}
    }, ahora),
]);
};