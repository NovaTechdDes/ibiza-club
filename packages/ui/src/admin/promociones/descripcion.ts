import type { DiaPromocion } from "@ibiza/shared";
import type { PromocionListada } from "./usePromociones";

const TEXTO_DIAS: Record<DiaPromocion, string> = {
    VIERNES: "Viernes",
    SABADO: "Sábados",
    AMBOS: "Viernes y sábados"
};

export function textoBeneficio(promo: PromocionListada): string {
    switch (promo.tipo){
        case "NXM":
            return `${promo.llevar}x${promo.pagar}`;
        case "PORCENTAJE":
            return `${promo.porcentaje}% de descuento`;
        case "MONTO_FIJO":
            return `$ ${(promo.monto ?? 0).toLocaleString("es-AR")} de descuento`;
    }
}


export function textoVigencia(promo: PromocionListada): string {
    const horario = promo.horaDesde && promo.horaHasta ? `de ${promo.horaDesde} a ${promo.horaHasta}` : "toda la noche";
    return `${TEXTO_DIAS[promo.dias]} · ${horario}`;
}

export type Nombres = {
    productos: Map<number, string>;
    categorias: Map<number, string>;
    envases: Map<number, string>;
};

const nombrar = (ids: number[], nombres: Map<number, string>) => 
    ids.map((id) => nombres.get(id) ?? `#${id}`);

export function textoAlcance(promo: PromocionListada, nombres: Nombres): string {
    const que = [
        ...nombrar(promo.categoriaIds, nombres.categorias).map((n) => `Categoría ${n}`),
        ...nombrar(promo.productoIds, nombres.productos)
    ];
    const envases = nombrar(promo.envaseIds, nombres.envases);
    return `${que.join(", ")} · ${envases.join(" y ")}`;
}