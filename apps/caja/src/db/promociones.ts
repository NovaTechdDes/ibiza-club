import { DiaPromocion, PromoCalculo, TipoPromocion } from "@ibiza/shared";
import { obtenerDb } from "./conexion";

type FilaPromo = {
    id: number;
    nombre: string;
     tipo: TipoPromocion;
     llevar: number | null;
     pagar: number | null;
     porcentaje: number | null;
     monto: number | null;
     dias: DiaPromocion;
     horaDesde: string | null;
     horaHasta: string | null;
     pausada: number;
};

type FilaAlcance = {
    promocionId: number;
    productoId: number | null;
    categoriaId: number | null;
}

type FilaEnvase = { promocionId: number; envaseId:number}

export const leerPromociones = async(): Promise<PromoCalculo[]> => {
    const db = await obtenerDb();
    const promos = await db.select<FilaPromo[]>(`SELECT id, nombre, tipo, llevar, pagar, porcentaje, monto, dias, horaDesde, horaHasta, pausada FROM Promocion WHERE activo = 1`) 
    const alcances = await db.select<FilaAlcance[]>(`SELECT promocionId, productoId, categoriaId FROM PromocionAlcance WHERE activo = 1`);
    const envases = await db.select<FilaEnvase[]>(`SELECT promocionId, envaseId FROM PromocionEnvase WHERE activo = 1`);

    return promos.map((promo) => ({
        ...promo,
        pausada: promo.pausada === 1,
        llevar: promo.llevar ?? undefined,
        pagar: promo.pagar ?? undefined,
        porcentaje: promo.porcentaje ?? undefined,
        monto: promo.monto ?? undefined,
        envaseIds: envases.filter((e) => e.promocionId === promo.id).map((e) => e.envaseId),
        productoIds: alcances
        .filter((a) => a.promocionId === promo.id)
        .map((a) => a.productoId)
        .filter((id): id is number => id !== null),
        categoriaIds: alcances
        .filter((a) => a.promocionId === promo.id)
        .map((a) => a.categoriaId)
        .filter((id): id is number => id !== null),
    }))
}