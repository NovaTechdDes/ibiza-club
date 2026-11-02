import { MEDIOS_PAGO, type MedioPago, type RangoReporte, rangoJornada } from '@ibiza/shared';
import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../db/prisma.js';
import { number } from 'zod';
const instantes = ({desde, hasta}: RangoReporte) => ({
    gte: rangoJornada(desde).inicio,
    lt: rangoJornada(hasta).fin
});

// Venta valida = sin anulacion. La anulacion es un registro aparte ( las operaciones no se edita)
const ventasValidas = (rango: RangoReporte): Prisma.VentaWhereInput => ({
    ocurridaEn: instantes(rango),
    anulacion: {is: null}
});


export const ventasPorMedioPago = async (rango: RangoReporte) => {
    const [ grupos, anuladas ] = await Promise.all([
        prisma.venta.groupBy({
            by: ['medioPago'],
            where: ventasValidas(rango),
            _count: { _all: true},
            _sum: { subTotal: true, descuento: true, total: true}
        }),
        prisma.venta.count({
            where: { ocurridaEn: instantes( rango ), anulacion: {isNot: null}}
        })
    ]);

    // Se parte de Medios_PAGO para que un medio sin ventas salga en 0 en vez de faltar
    const medios = MEDIOS_PAGO.map((medioPago) => {
        const g = grupos.find((x) => x.medioPago === medioPago);
        return {
            medioPago,
            ventas: g?._count._all ?? 0,
            subTotal: g?._sum.subTotal ?? 0,
            descuento: g?._sum.descuento ?? 0,
            total: g?._sum.total ?? 0
        };
    });

    const totales = medios.reduce((acc, m) => ({
        ventas: acc.ventas + m.ventas,
        subTotal: acc.subTotal + m.subTotal,
        descuento: acc.descuento + m.descuento,
        total: acc.total + m.total
    }),
    { ventas: 0, subTotal: 0, descuento: 0, total: 0}
);
return {...rango, medios, totales, anuladas}
};

export const ventasPorCaja = async(rango: RangoReporte) => {
    const [ grupos, anuladas ] = await Promise.all([
        prisma.venta.groupBy({
            by: ['cajaId', 'medioPago'],
            where: ventasValidas(rango),
            _count: {_all: true},
            _sum: {descuento: true, total: true}
        }),
        prisma.venta.count({
            where: { ocurridaEn: instantes(rango), anulacion: {isNot: null}}
        })
    ]);

    const ids = [...new Set(grupos.map(g => g.cajaId))];

    // groupBy no trae relaciones: nombre y barra se buscan aparte.
    // Activas (para que las que no vendieron salgan en 0) + las que vendieron en el rango aunque hoy estén dadas de baja
    const listaCajas = await prisma.caja.findMany({
        select: { id: true, nombre: true, barra: true },
        where: { OR: [{ activo: true }, { id: { in: ids } }] },
        orderBy: { nombre: 'asc' }
    });

    const cajas = listaCajas.map((caja) => {
        const propios = grupos.filter((g) => g.cajaId === caja.id);

        // Se parte de MEDIOS_PAGO para que los tres medios estén siempre, aunque sea en 0
        const porMedio = Object.fromEntries(MEDIOS_PAGO.map((medioPago) => [
            medioPago,
            propios.find((g) => g.medioPago === medioPago)?._sum.total ?? 0
        ])) as Record<MedioPago, number>;

        return {
            cajaId: caja.id,
            nombre: caja.nombre,
            barra: caja.barra,
            ventas: propios.reduce((acc, g) => acc + g._count._all, 0),
            descuento: propios.reduce((acc, g) => acc + (g._sum.descuento ?? 0), 0),
            total: propios.reduce((acc, g) => acc + (g._sum.total ?? 0), 0),
            porMedio
        };
    });

    // Las barras salen de las cajas ya armadas: barra es opcional y solo sirve para agrupar
    const porBarra = new Map<string, { barra: string; cajas: number; ventas: number; descuento: number; total: number }>();
    for (const caja of cajas) {
        const barra = caja.barra ?? 'Sin barra';
        const acc = porBarra.get(barra) ?? { barra, cajas: 0, ventas: 0, descuento: 0, total: 0 };
        acc.cajas += 1;
        acc.ventas += caja.ventas;
        acc.descuento += caja.descuento;
        acc.total += caja.total;
        porBarra.set(barra, acc);
    }
    const barras = [...porBarra.values()];

    return { ...rango, cajas, barras, anuladas };
};

export const ventasPorPromo = async(rango: RangoReporte) => {
    const grupos = await prisma.itemVenta.groupBy({
        by: ['promocionId'],
        where: {
            promocionId: { not: null},
            venta: ventasValidas(rango)
        },
        _count: { _all: true},
        _sum: { cantidad: true, descuento: true}
    });

    const ids = grupos.map((g) => g.promocionId).filter((id): id is number => id !== null);

    const listaPromociones = await prisma.promocion.findMany({
        select: { id: true, nombre: true, tipo: true},
        where: {id: {in: ids}}
    });

    const promociones = listaPromociones.map((promocion) => {
        const g = grupos.find((x) => x.promocionId === promocion.id);

        return {
            promocionId: promocion.id,
            nombre: promocion.nombre,
            tipo: promocion.tipo,
            lineas: g?._count._all ?? 0,
            unidades: g?._sum.cantidad ?? 0,
            descuento: g?._sum.descuento ?? 0
        }
    })
    
    promociones.sort((a, b) => b.descuento - a.descuento)

    const totalDescuento = promociones.reduce((acc, g) => acc + g.descuento, 0)

    return {
        ...rango, promos: promociones, totalDescuento
    }


};

export const arqueo = async (rango: RangoReporte) => {
    const aperturas = await prisma.aperturaCaja.findMany({
        where: { ocurridaEn: instantes(rango)},
        select: {
            id: true,
            fondo: true,
            ocurridaEn: true,
            caja: { select: { nombre: true, barra: true}},
            cajero: {select: { nombre: true}},
            cierre: {
                select: {
                    contado: true, esperado: true, diferencia: true,
                    totalTarjeta: true, totalTransferencia: true,
                    pendiente: true, ocurridaEn: true,
                    cerradoPor: { select: {nombre: true}}
                }
            }
        },
        orderBy: { ocurridaEn: 'asc'}
    })

    const arqueos = aperturas.map((a => {
        return {
            aperturaId: a.id,
            caja: a.caja.nombre,
            fondo: a.fondo,
            apertura: a.ocurridaEn,
            barra: a.caja.barra,
            cajero: a.cajero.nombre,
            contado: a.cierre?.contado ?? null,
            esperado: a.cierre?.esperado ?? null,
            diferencia: a.cierre?.diferencia ?? null,
            totalTarjeta: a.cierre?.totalTarjeta ?? null,
            totalTransferencia: a.cierre?.totalTransferencia ?? null,
            cerradoPor: a.cierre?.cerradoPor.nombre ?? null,
            cierre: a.cierre?.ocurridaEn ?? null,
            estado: !a.cierre ? 'ABIERTA' : a.cierre.pendiente ? 'PENDIENTE' : 'CERRADA'
        };
    }));

    const totales = arqueos.reduce((acc, a) => ({
        contado:  acc.contado + (a.contado ?? 0),
        esperado: acc.esperado + (a.esperado ?? 0),
        diferencia: acc.diferencia + (a.diferencia ?? 0),
        abiertas: acc.abiertas + (a.estado === 'ABIERTA' ? 1 : 0)
    }),
    {contado: 0, esperado: 0, diferencia: 0, abiertas: 0})

    return {
        ...rango, arqueos, totales
    }
}

// La caja pregunta por cambios cada 1-2 minutos: con 5 ya se perdieron varios contactos seguidos
const MINUTOS_SIN_CONTACTO = 5;

const estadoConexion = (ultimoContactoEn: Date | null, ahora: Date) => {
    if (!ultimoContactoEn) return 'NUNCA';
    const minutos = (ahora.getTime() - ultimoContactoEn.getTime()) / 60_000;
    return minutos <= MINUTOS_SIN_CONTACTO ? 'CONECTADA' : 'SIN_CONTACTO';
};

// Foto del momento: no lleva rango de fechas. Solo cajas activas, las dadas de baja no se vigilan
export const estadoSincronizacion = async () => {
    const [{ actual: versionActual }, listaCajas, ultimasVentas] = await Promise.all([
        prisma.versionConfig.findUniqueOrThrow({ where: { id: 1 } }),
        prisma.caja.findMany({
            where: { activo: true },
            select: {
                id: true, nombre: true, barra: true,
                estadoSync: { select: { ultimoContactoEn: true, versionCatalogo: true, ultimaSubidaEn: true } }
            },
            orderBy: { nombre: 'asc' }
        }),
        prisma.venta.groupBy({
            by: ['cajaId'],
            _max: { recibidaEn: true }
        })
    ]);

    const ahora = new Date();

    const cajas = listaCajas.map((caja) => {
        const versionCatalogo = caja.estadoSync?.versionCatalogo ?? null;
        const ultimoContactoEn = caja.estadoSync?.ultimoContactoEn ?? null;

        return {
            cajaId: caja.id,
            nombre: caja.nombre,
            barra: caja.barra,
            estado: estadoConexion(ultimoContactoEn, ahora),
            ultimoContactoEn,
            ultimaSubidaEn: caja.estadoSync?.ultimaSubidaEn ?? null,
            ultimaVentaRecibidaEn: ultimasVentas.find((v) => v.cajaId === caja.id)?._max.recibidaEn ?? null,
            versionCatalogo,
            // versionCatalogo es lo que la caja tenía al preguntar: lo que baje en esa respuesta se ve recién en el contacto siguiente.
            // Math.max porque una caja con versión mayor a la nube no está atrasada: ese caso lo resuelve el 409 de la bajada
            versionesAtrasadas: versionCatalogo === null ? null : Math.max(versionActual - versionCatalogo, 0)
        };
    });

    const totales = {
        conectadas: cajas.filter((c) => c.estado === 'CONECTADA').length,
        sinContacto: cajas.filter((c) => c.estado === 'SIN_CONTACTO').length,
        nunca: cajas.filter((c) => c.estado === 'NUNCA').length
    };

    return { generadoEn: ahora, versionActual, cajas, totales };
};