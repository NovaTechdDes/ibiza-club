import { OperacionSubida } from "@ibiza/shared";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";

type Tx = Prisma.TransactionClient;

//OP<"VENTA"> es el tipo de una operacion venta, sacado de la union de shared
type Op<T extends OperacionSubida["tipo"]> = Extract<OperacionSubida, { tipo: T}>

//Algo que la caja mando y no se puede guardar (todavia o nunca). No es un error del servidor
class OperacionRechazada extends Error {};

// Traduce el idLocal de una apertura de esta caja al id que le puso la nube
const buscarAperturaId = async(tx: Tx, cajaId: number, idLocal: number) => {
    const apertura = await tx.aperturaCaja.findUnique({
        where: { cajaId_idLocal: { cajaId, idLocal}},
        select: {id: true}
    });
    if(!apertura) throw new OperacionRechazada(`La apertura ${idLocal} todavia no llego a la nube`);
    return apertura.id;
}
const buscarVentaId = async(tx: Tx, cajaId: number, idLocal: number) => {
    const venta = await tx.venta.findUnique({
        where: { cajaId_idLocal: { cajaId, idLocal}},
        select: {id: true}
    });
    if(!venta) throw new OperacionRechazada(`La venta ${idLocal} todavia no llego a la nube`);
    return venta.id;
}

const guardarVenta = async(tx: Tx, cajaId: number, op: Op<"VENTA">) => {
    // Si ya esta, es un reintento: no se hace nada y cuenta como confirmada
    const existe = await tx.venta.findUnique({where: { cajaId_idLocal: { cajaId, idLocal: op.idLocal}}})

    if (existe) return;

    const aperturaId = await buscarAperturaId(tx, cajaId, op.aperturaIdLocal);
    await tx.venta.create({
        data: {
            cajaId, idLocal: op.idLocal, aperturaId,
            numero: op.numero, cajeroId: op.cajeroId, medioPago: op.medioPago,
            subTotal: op.subTotal, descuento: op.descuento, total: op.total,
            ocurridaEn: new Date(op.ocurridaEn),
            items: { create: op.items}
        }
    })
};

const guardarApertura = async (tx: Tx, cajaId: number, op: Op<"APERTURA">) => {
    const existe = await tx.aperturaCaja.findUnique({ where: { cajaId_idLocal: {cajaId, idLocal: op.idLocal}}});
    if(existe) return;
    let jornadaId: number | null = null;
    if(op.jornada){
        // Una sola fecha para el where y el create: Prisma exige un Date, no el string "2026-10-23"
        const fecha = new Date(op.jornada.fecha);
        const jornada = await tx.jornada.upsert({
            where: { fecha },
            create: { fecha, letra: op.jornada.letra },
            update: {}
        })
        // Si otra caja ya creó la jornada con otra letra, alguna tiene mal la clave o el reloj
        if (jornada.letra !== op.jornada.letra){
            throw new OperacionRechazada(`La jornada ${op.jornada.fecha} tiene letra ${jornada.letra} y la caja mandó ${op.jornada.letra}`)
        }
        jornadaId = jornada.id
    }

    await tx.aperturaCaja.create({
        data: {
            cajaId, idLocal: op.idLocal, cajeroId: op.cajeroId,
            jornadaId,
            encargadoId: op.encargadoId, fondo: op.fondo,
            ocurridaEn: new Date(op.ocurridaEn)
        }
    })
};

const guardarMovimiento = async (tx: Tx, cajaId: number, op: Op<"MOVIMIENTO">) => {
    const existe = await tx.movimientoCaja.findUnique({ where: { cajaId_idLocal: {cajaId, idLocal: op.idLocal}}});

    if(existe) return;

    const aperturaId = await buscarAperturaId(tx, cajaId, op.aperturaIdLocal)
    await tx.movimientoCaja.create({
        data: {
            cajaId, idLocal: op.idLocal, aperturaId, monto: op.monto, tipo: op.tipoMovimiento,
            usuarioId: op.usuarioId,
            motivo: op.motivo,
            autorizoId: op.autorizoId,
            ocurridaEn: new Date(op.ocurridaEn)
        }
    })
};

const guardarAnulacion = async (tx: Tx, cajaId: number, op: Op<"ANULACION">) => {
    const existe = await tx.anulacion.findUnique({ where: { cajaId_idLocal: {cajaId, idLocal: op.idLocal}}});

    if(existe) return;
    const ventaId = await buscarVentaId(tx, cajaId, op.ventaIdLocal);

    await tx.anulacion.create({
        data: {
            cajaId, idLocal: op.idLocal,
            encargadoId: op.encargadoId,
            motivo: op.motivo, ventaId: ventaId,
            ocurridaEn: new Date(op.ocurridaEn)
        }
    })
};

const guardarCierre = async (tx: Tx, cajaId: number, op: Op<"CIERRE">) => {
    const existe = await tx.cierreCaja.findUnique({ where: { cajaId_idLocal: {cajaId, idLocal: op.idLocal}}});

    if(existe) return;
    const aperturaId = await buscarAperturaId(tx, cajaId, op.aperturaIdLocal)
    await tx.cierreCaja.create({
        data: {
            cajaId, idLocal: op.idLocal, pendiente: op.pendiente,
            ocurridaEn: new Date(op.ocurridaEn), aperturaId, cerradoPorId: op.cerradoPorId, contado: op.contado, diferencia: op.diferencia, 
            esperado: op.esperado, totalTarjeta: op.totalTarjeta, totalTransferencia: op.totalTransferencia, 
        }
    })
};

const guardarAuditoria = async (tx: Tx, cajaId: number, op: Op<"AUDITORIA">) => {
    const existe = await tx.auditoriaCaja.findUnique({ where: { cajaId_idLocal: {cajaId, idLocal: op.idLocal}}});

    if(existe) return;
    
    await tx.auditoriaCaja.create({
        data: {
            cajaId, idLocal: op.idLocal, usuarioId: op.usuarioId ?? null,
            detalle: op.detalle ,
            ocurridaEn: new Date(op.ocurridaEn), accion: op.accion, 
            
        }
    })
};


const guardar = (tx: Tx, cajaId: number, op: OperacionSubida): Promise<void> => {
    switch(op.tipo){
        case "APERTURA": return guardarApertura(tx, cajaId, op);
        case "VENTA": return guardarVenta(tx, cajaId, op);
        case "MOVIMIENTO": return guardarMovimiento(tx, cajaId, op);
        case "ANULACION": return guardarAnulacion(tx, cajaId, op);
        case "CIERRE": return guardarCierre(tx, cajaId, op);
        case "AUDITORIA": return guardarAuditoria(tx, cajaId, op);
    }
};

// Devuleve el motivo si es un rechazo esperable, o null si es un error de verdad
const motivoRechazo = (error: unknown) => {
    if(error instanceof OperacionRechazada) return error.message;
    if (error instanceof Prisma.PrismaClientKnownRequestError){
        if (error.code === "P2003") return  "Hace referencia a un usuario, variante o promo que no existe";
        if (error.code === "P2002") return "Choca con un dato que ya existe (ticket, anulacion o cierre repetido)"
    };

    return null;
};

export const procesarSubida = async(cajaId: number, operaciones: OperacionSubida[]) => {
    const confirmadas: { tipo: OperacionSubida["tipo"]; idLocal: number}[ ] = [];

    for(const op of operaciones){
        try {
            await prisma.$transaction((tx) => guardar(tx, cajaId, op));
        } catch (error) {
            const motivo =  motivoRechazo(error);
            if(motivo === null) throw error;
            return { confirmadas, rechazada: { tipo: op.tipo, idLocal: op.idLocal, motivo}};
        }
        confirmadas.push({ tipo: op.tipo, idLocal: op.idLocal})
    }
    return { confirmadas, rechazada: null}
}