import { NOMBRE_DIA } from "@ibiza/shared";
import type { PromocionListada } from "./usePromociones";

// [5, 6] → "Vie y Sáb"; los 7 → "Todos los días".
function textoDias(dias: number[]): string {
    if (dias.length === 7) return "Todos los días";

    const nombres = dias.map((d) => NOMBRE_DIA[d] ?? `#${d}`);
    return nombres.length > 1
        ? `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`
        : nombres.join("");
}

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
    return `${textoDias(promo.dias)} · ${horario}`;
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
