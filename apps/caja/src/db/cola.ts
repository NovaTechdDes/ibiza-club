import { type MedioPago, type OperacionSubida, TAMANO_LOTE, type TipoMovimiento } from "@ibiza/shared";
import { obtenerDb, transaccion } from "./conexion";

type Tipo = OperacionSubida["tipo"];

// Lo que devuleve la nube por cada operacion: cont ipo  + idLocal se encuntra la fila de la cola
export type RefOperacion = { tipo: Tipo; idLocal: number};
export type Rechazada = RefOperacion & { motivo: string};

type FilaCola = RefOperacion & {id: number};

type FilaApertura = {
    id: number;
    cajeroId: number;
    encargadoId: number;
    fondo: number;
    jornadaFecha: string | null;
    jornadaLetra: string | null;
    ocurridaEn: string;
};

type FilaVenta = {
    id: number;
    aperturaId: number;
    cajeroId: number;
    numero: number;
    medioPago: MedioPago;
    subTotal: number;
    descuento: number;
    total: number;
    ocurridaEn: string;
}
type FilaItem = {
    varianteId: number;
    nombre: string;
    precioUnitario: number;
    cantidad: number;
    promocionId: number | null;
    promocionNombre: string | null;
    descuento: number;
}

type FilaMovimiento = {
    id: number;
    aperturaId: number;
    tipo: TipoMovimiento;
    monto: number;
    motivo: string | null;
    usuarioId: number;
    autorizoId: number | null;
    ocurridaEn: string
}

type FilaAuditoria = {
    id: number;
    usuarioId: number | null;
    accion: string;
    detalle: string | null;
    ocurridaEn: string;
};

type FilaAnulacion = {
    id: number; ventaId: number; encargadoId: number;
    motivo: string; ocurridaEn: string;
};

type FilaCierre = {
    id: number;
    aperturaId: number;
    cerradoPorId: number;
    contado: number;
    esperado: number;
    diferencia: number;
    totalTarjeta: number;
    totalTransferencia: number;
    pendiente: number;   // 0 o 1 en SQLite
    ocurridaEn: string;
}

const armarAnulacion = async (idLocal: number): Promise<OperacionSubida> => {
    const db = await obtenerDb();
    const [ a ] = await db.select<FilaAnulacion[]>(
        ` SELECT id, ventaId, encargadoId, motivo, ocurridaEn FROM Anulacion WHERE id = $1`,
        [idLocal]
    );
    if(!a) throw new Error(`La anulacion ${idLocal} esta en la cola pero no en la base`);
    return {
        tipo: "ANULACION",
        idLocal: a.id,
        ventaIdLocal: a.ventaId,
        encargadoId: a.encargadoId,
        motivo: a.motivo,
        ocurridaEn: a.ocurridaEn
    }
}

const armarApertura = async (idLocal: number): Promise<OperacionSubida> => {
    const db = await obtenerDb();
    const [ a ] = await db.select<FilaApertura[]>(
        `SELECT id, cajeroId, encargadoId, fondo, jornadaFecha, jornadaLetra, ocurridaEn FROM AperturaCaja where id = $1`,
        [idLocal]
    );

    if (!a) throw new Error(`La apertura ${idLocal} esta en la cola pero no en la base`);

    return {
        tipo: "APERTURA",
        idLocal: a.id,
        cajeroId: a.cajeroId,
        fondo: a.fondo,
        encargadoId: a.encargadoId,
        ocurridaEn: a.ocurridaEn,
        jornada: a.jornadaFecha && a.jornadaLetra ? {fecha: a.jornadaFecha, letra: a.jornadaLetra} : undefined
    };
};

const armarVenta = async(idLocal: number): Promise<OperacionSubida> => {
    const db = await obtenerDb();
    const [v]  = await db.select<FilaVenta[]>(
        `SELECT id, aperturaId, numero, ocurridaEn, cajeroId, medioPago, subTotal, descuento, total FROM Venta where id = $1`,
        [idLocal] 
    )

    if(!v) throw new Error(`La venta ${idLocal} esta en la cola pero no en la base`)
    
    const items = await db.select<FilaItem[]>(
        `SELECT varianteId, nombre, precioUnitario, cantidad, promocionId, promocionNombre, descuento
        FROM ItemVenta where ventaId = $1`, [v.id]
    );

    return {
        tipo: 'VENTA',
        idLocal: v.id,
        numero: v.numero,
        cajeroId: v.cajeroId,
        medioPago: v.medioPago,
        subTotal: v.subTotal,
        descuento: v.descuento,
        total: v.total,
        ocurridaEn: v.ocurridaEn,
        aperturaIdLocal: v.aperturaId,
        items,
    }
}

const armar = (fila: FilaCola): Promise<OperacionSubida> => {
    switch (fila.tipo){
        case "APERTURA":
            return armarApertura(fila.idLocal);
        case "VENTA":
            return armarVenta(fila.idLocal);
        case "MOVIMIENTO":
            return armarMovimiento(fila.idLocal)
        case "AUDITORIA":
            return armarAuditoria(fila.idLocal);
        case "ANULACION":
            return armarAnulacion(fila.idLocal)
        case "CIERRE":
            return armarCierre(fila.idLocal)
        default:
            throw new Error(`Todavia no se sabe subir operaciones ${fila.tipo}`)
    }
}

const armarMovimiento = async(idLocal: number): Promise<OperacionSubida> => {
    const db = await obtenerDb();
    const [m] = await db.select<FilaMovimiento[]>(
        `SELECT id, aperturaId, tipo, monto, motivo, usuarioId, autorizoId, ocurridaEn
        FROM MovimientoCaja where id = $1`, [idLocal]
    )

    if(!m) throw new Error(`El movimiento ${idLocal} esta en acola pero no en la base`)

    return {
        tipo: "MOVIMIENTO",
        idLocal: m.id,
        monto: m.monto,
        motivo: m.motivo ?? undefined,
        autorizoId: m.autorizoId ?? undefined,
        aperturaIdLocal: m.aperturaId,
        tipoMovimiento: m.tipo,
        usuarioId: m.usuarioId,
        ocurridaEn: m.ocurridaEn
    }
};

const armarCierre = async(idLocal: number): Promise<OperacionSubida> => {
    const db = await obtenerDb();
    const [c] = await db.select<FilaCierre[]>(
        `
        SELECT id, aperturaId, cerradoPorId, contado, esperado, diferencia, totalTarjeta, totalTransferencia, pendiente, ocurridaEn
        FROM CierreCaja WHERE id = $1
        `,
        [idLocal]
    )

    if(!c) throw new Error(`El cierre ${idLocal} esta en la cola pero no en la base`);

    return {
         tipo: "CIERRE",
        idLocal: c.id,
        aperturaIdLocal: c.aperturaId,
        cerradoPorId: c.cerradoPorId,
        contado: c.contado,
        esperado: c.esperado,
        diferencia: c.diferencia,
        totalTarjeta: c.totalTarjeta,
        totalTransferencia: c.totalTransferencia,
        pendiente: c.pendiente === 1,
        ocurridaEn: c.ocurridaEn,
    }
}

// El orden de la cola a respeta las dependecias: la apertura se guarda antes que las ventas
export const leerLote = async (): Promise<OperacionSubida[]> => {
    const db = await obtenerDb();
    const filas = await db.select<FilaCola[]>(
        `SELECT id, tipo, idLocal FROM ColaSync WHERE enviadaEn IS NULL ORDER BY id LIMIT $1`, [TAMANO_LOTE]
    );

    // Promise.all respeta el orden del array aunque las consutas terminen desordenadas
    return Promise.all(filas.map(armar));
};

// No se borran: quedan marcas. Borrarlas despues de unos dias es otro tema
export const marcarConfirmadas = async (confirmadas: RefOperacion[]) => {
    if(confirmadas.length === 0) return;

    const ahora = new Date().toISOString();
    await transaccion(
        confirmadas.map(({ tipo, idLocal}) => ({
            sql: `UPDATE ColaSync SET enviadaEn = $1, ultimoError = NULL WHERE tipo = $2 AND idLocal = $3`, valores: [ahora, tipo, idLocal]
        }))
    )
};

export const marcarRechazada = async ({tipo, idLocal, motivo}: Rechazada) => {
    const db = await obtenerDb();
    await db.execute(
        `UPDATE ColaSync SET intentos = intentos + 1, ultimoError = $1 WHERE tipo = $2 AND idLocal = $3`, [motivo, tipo, idLocal]
    )
};

export const contarPendientes = async() => {
    const db = await obtenerDb();
    const [fila] = await db.select<{cantidad:number}[]>(
        `SELECT COUNT(*) AS cantidad FROM ColaSync WHERE enviadaEn IS NULL`
    )

    return fila?.cantidad ?? 0
};

const armarAuditoria = async (idLocal: number): Promise<OperacionSubida> => {
    const db = await obtenerDb();
    const [ a ] = await db.select<FilaAuditoria[]>(
        `SELECT id, usuarioId, accion, detalle, ocurridaEn FROM AuditoriaCaja Where id = $1`,
        [idLocal]
    );
    if(!a) throw new Error(`La auditoria ${idLocal} esta en la cola pero no en la base`);

    return {
        tipo: 'AUDITORIA',
        idLocal: a.id,
        usuarioId: a.usuarioId,
        accion: a.accion,
        detalle: a.detalle ?? undefined,
        ocurridaEn: a.ocurridaEn
    };
};