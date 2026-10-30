import { HORA_CORTE_JORNADA } from "../../constantes.js";
import { descuentoDePromo, type ItemCarrito, type PromoCalculo } from "./descuento.js";
import { promoVigente } from "./vigencia.js";

export interface LineaCalculada extends ItemCarrito {
    subTotal: number;
    promocionId: number | null;
    promocionNombre: string | null;
    descuento: number;
};

// El carrito entero calculado. Los totales coinciden con Venta.
export interface CarritoCalculado {
    lineas: LineaCalculada[];
    subTotal: number;
    descuento: number; 
    total: number;
};


// Junta las lineas de la misma variante sumando cantidades.
// Mantiene el orden en que aparecieron y no modifica los items originales

export function agruparLineas(items: ItemCarrito[]): ItemCarrito[]{
    const porVariante = new Map<number, ItemCarrito>();
    for (const item of items ){
        const existente = porVariante.get(item.varianteId);
        if(existente){
            existente.cantidad += item.cantidad;
        }else{
            porVariante.set(item.varianteId, {...item})
        }
    }
    return [...porVariante.values()]
}

// La promo que mas descuenta sobre la linea, o null si ninguna descuenta
// Las promos tienen que venir ordenas por id: ante empate gana la primera
function mejorPromo(promos: PromoCalculo[], item: ItemCarrito){
    let mejor: { promo: PromoCalculo; descuento: number} | null = null;
    for(const promo of promos){
        const descuento = descuentoDePromo(promo, item);
        if(descuento > 0 && (mejor === null || descuento > mejor.descuento)){
            mejor = { promo, descuento}
        }
    }
    return mejor;
}

// Aplica las promos vigentes en el instante al carrito. No se acumulan:
// Cada linea se queda con las mas conveniente para el cliente
export function aplicarPromos(items: ItemCarrito[], promos: PromoCalculo[], instante: Date, horaCorte: number = HORA_CORTE_JORNADA): CarritoCalculado{
    const vigentes = promos.filter((p) => promoVigente(p, instante, horaCorte)).sort((a, b) => a.id - b.id);
    const lineas = agruparLineas(items).map((item): LineaCalculada => {
        const mejor = mejorPromo(vigentes, item);

        return {
            ...item, subTotal: item.precio * item.cantidad,
            promocionId: mejor?.promo.id ?? null,
            promocionNombre: mejor?.promo.nombre ?? null,
            descuento: mejor?.descuento ?? 0,
        };
    });

    const subTotal = lineas.reduce((suma, l) => suma + l.subTotal, 0)
    const descuento = lineas.reduce((suma, l) => suma + l.descuento, 0);
    return {lineas, subTotal, descuento, total: subTotal - descuento}
}