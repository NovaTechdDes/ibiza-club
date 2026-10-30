import { MEDIOS_PAGO, type MedioPago, type RangoReporte, rangoJornada } from '@ibiza/shared';
import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../db/prisma.js';
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
