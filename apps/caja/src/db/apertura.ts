import { obtenerDb, transaccion } from "./conexion";

export type Jornada = { fecha: string; letra: string};

export type Apertura = {
    id: number;
    cajeroId: number;
    encargadoId: number;
    fondo: number;
    jornadaFecha: string | null;
    jornadaLetra: string | null;
    ocurridaEn: string;
}

type NuevaApertura = {
    cajeroId: number;
    encargadoId: number;
    fondo: number;
    jornada: Jornada | null;
};

// Una apertura sigue abierta mientras no tenga cierre
export const leerAperturaAbierta = async (): Promise<Apertura | null> => {
    const db = await obtenerDb();
    const filas = await db.select<Apertura[]>(
        `SELECT a.id, a.cajeroId, a.encargadoId, a.fondo, a.jornadaFecha, a.jornadaLetra, a.ocurridaEn FROM AperturaCaja a
        LEFT JOIN CierreCaja c ON c.aperturaId = a.id
        WHERE c.id IS NULL
        ORDER BY a.id DESC
        LIMIT 1`
    );
    return filas[0] ?? null;
};

export const crearApertura = async ({cajeroId, encargadoId, fondo, jornada}: NuevaApertura) => {
    if(await leerAperturaAbierta()) throw new Error("Esta caja ya tiene una apertura abierta");

    const ahora = new Date().toISOString();

    await transaccion([
        {
            sql: `INSERT INTO AperturaCaja (cajeroId, encargadoId, fondo, jornadaFecha, jornadaLetra, ocurridaEn) VALUES ($1, $2, $3, $4, $5, $6)`,
            valores: [cajeroId, encargadoId, fondo, jornada?.fecha ?? null, jornada?.letra ?? null, ahora]
        },
        {
            sql: `INSERT INTO ColaSync (tipo, idLocal, creadaEn) VALUES ('APERTURA', last_insert_rowid(), $1)`, valores: [ahora]
        }
    ]);
}