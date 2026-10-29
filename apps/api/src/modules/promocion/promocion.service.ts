import { PromocionInput } from "@ibiza/shared";
import { prisma } from "../../db/prisma.js"
import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../errors/app-error.js";
import { escribirCatalogo } from "../comun/escritura-catalogo.js";

type Tx = Prisma.TransactionClient;

const seleccion = {
    id: true,
    nombre: true,
    tipo: true,
    llevar: true,
    pagar: true,
    porcentaje: true,
    monto: true,
    dias: true,
    horaDesde: true,
    horaHasta: true,
    pausada: true,
    activo: true,
    version: true,
    promocionAlcances: { where: { activo: true }, select: { productoId: true, categoriaId: true } },
    promocionEnvases: { where: { activo: true }, select: { envaseId: true } }
} satisfies Prisma.PromocionSelect;

type PromocionDb = Prisma.PromocionGetPayload<{ select: typeof seleccion }>;

const aRespuesta = ({ promocionAlcances, promocionEnvases, ...promo }: PromocionDb) => ({
    ...promo,
    productoIds: promocionAlcances.flatMap((a) => a.productoId ? [a.productoId] : []),
    categoriaIds: promocionAlcances.flatMap((a) => a.categoriaId ? [a.categoriaId] : []),
    envaseIds: promocionEnvases.map((e) => e.envaseId)
});

const datosPromo = (input: PromocionInput) => ({
    nombre: input.nombre,
    tipo: input.tipo,
    llevar: input.llevar ?? null,
    pagar: input.pagar ?? null,
    porcentaje: input.porcentaje ?? null,
    monto: input.monto ?? null,
    dias: input.dias,
    horaDesde: input.horaDesde ?? null,
    horaHasta: input.horaHasta ?? null,
    pausada: input.pausada
});

const validarReferencias = async (input: PromocionInput) => {
    const productoIds = [...new Set(input.productoIds)];
    const categoriaIds = [...new Set(input.categoriaIds)];
    const envaseIds = [...new Set(input.envaseIds)];

    const [productos, categorias, envases] = await Promise.all([
        prisma.producto.count({ where: { id: { in: productoIds }, activo: true } }),
        prisma.categoria.count({ where: { id: { in: categoriaIds }, activo: true } }),
        prisma.envase.count({ where: { id: { in: envaseIds }, activo: true } })
    ]);

    if(productos !== productoIds.length) throw AppError.conflicto('Hay productos inexistentes o inactivos');
    if(categorias !== categoriaIds.length) throw AppError.conflicto('Hay categorias inexistentes o inactivas');
    if(envases !== envaseIds.length) throw AppError.conflicto('Hay envases inexistentes o inactivos');
};

// Deja activas exactamente las filas deseadas: reactiva, crea o da de baja (nunca borra).
const sincronizarAlcances = async (tx: Tx, promocionId: number, input: PromocionInput, version: number) => {
    const deseados = new Set([
        ...input.productoIds.map((id) => `p:${id}`),
        ...input.categoriaIds.map((id) => `c:${id}`)
    ]);
    const existentes = await tx.promocionAlcance.findMany({ where: { promocionId } });
    const clave = (a: { productoId: number | null, categoriaId: number | null }) =>
        a.productoId ? `p:${a.productoId}` : `c:${a.categoriaId}`;

    const vistos = new Set<string>();
    for(const a of existentes){
        const k = clave(a);
        vistos.add(k);
        const debeEstarActivo = deseados.has(k);
        if(a.activo !== debeEstarActivo){
            await tx.promocionAlcance.update({ where: { id: a.id }, data: { activo: debeEstarActivo, version } });
        }
    }
    for(const k of deseados){
        if(vistos.has(k)) continue;
        const id = Number(k.slice(2));
        await tx.promocionAlcance.create({
            data: { promocionId, version, ...(k.startsWith('p:') ? { productoId: id } : { categoriaId: id }) }
        });
    }
};

const sincronizarEnvases = async (tx: Tx, promocionId: number, input: PromocionInput, version: number) => {
    const deseados = new Set(input.envaseIds);
    const existentes = await tx.promocionEnvase.findMany({ where: { promocionId } });

    const vistos = new Set<number>();
    for(const e of existentes){
        vistos.add(e.envaseId);
        const debeEstarActivo = deseados.has(e.envaseId);
        if(e.activo !== debeEstarActivo){
            await tx.promocionEnvase.update({ where: { id: e.id }, data: { activo: debeEstarActivo, version } });
        }
    }
    for(const envaseId of deseados){
        if(vistos.has(envaseId)) continue;
        await tx.promocionEnvase.create({ data: { promocionId, envaseId, version } });
    }
};

export const listarPromociones = async () => {
    const promos = await prisma.promocion.findMany({ select: seleccion, orderBy: [{ nombre: 'asc' }] });
    return promos.map(aRespuesta);
};

export const obtenerPromocion = async (id: number) => {
    const promo = await prisma.promocion.findUnique({ where: { id }, select: seleccion });

    if(!promo){
        throw AppError.noEncontrado('Promocion no encontrada')
    };

    return aRespuesta(promo);
};

export const crearPromocion = async (usuarioId: number, input: PromocionInput) => {
    await validarReferencias(input);

    const id = await escribirCatalogo(usuarioId, 'PROMOCION_CREAR', input, async (tx, version) => {
        const promo = await tx.promocion.create({ data: { ...datosPromo(input), version } });
        await sincronizarAlcances(tx, promo.id, input, version);
        await sincronizarEnvases(tx, promo.id, input, version);
        return promo.id;
    });

    return obtenerPromocion(id);
};

// Reemplazo completo (PUT): el panel manda la promo entera.
export const actualizarPromocion = async (usuarioId: number, id: number, input: PromocionInput) => {
    await obtenerPromocion(id);
    await validarReferencias(input);

    await escribirCatalogo(usuarioId, 'PROMOCION_ACTUALIZAR', input, async (tx, version) => {
        await tx.promocion.update({ where: { id }, data: { ...datosPromo(input), version } });
        await sincronizarAlcances(tx, id, input, version);
        await sincronizarEnvases(tx, id, input, version);
    });

    return obtenerPromocion(id);
};

export const cambiarPausaPromocion = async (usuarioId: number, id: number, pausada: boolean) => {
    await obtenerPromocion(id);

    await escribirCatalogo(usuarioId, pausada ? 'PROMOCION_PAUSAR' : 'PROMOCION_REANUDAR', { pausada }, (tx, version) =>
        tx.promocion.update({ where: { id }, data: { pausada, version } })
    );

    return obtenerPromocion(id);
};

export const cambiarEstadoPromocion = async (usuarioId: number, id: number, activo: boolean) => {
    await obtenerPromocion(id);

    await escribirCatalogo(usuarioId, activo ? 'PROMOCION_ALTA' : 'PROMOCION_BAJA', { activo }, (tx, version) =>
        tx.promocion.update({ where: { id }, data: { activo, version } })
    );

    return obtenerPromocion(id);
};
