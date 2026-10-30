import { PromocionInput } from "../../schemas/promocion.js";

export interface ItemCarrito {
    varianteId: number;
    productoId: number;
    categoriaId: number;
    envaseId: number;
    precio: number;
    cantidad: number;
}

// La promo tal como la usa el calculo: lo validado por Zod mas tu id.
export type PromoCalculo = PromocionInput & { id: number}

// La promo alcanza al item si incluye su producto o su categoria, yy ademas su envase.
export function promoAlcanza(promo: PromoCalculo, item: ItemCarrito): boolean{
    const porProducto = promo.productoIds.includes(item.productoId);
    const proCategoria = promo.categoriaIds.includes(item.categoriaId);
    return (porProducto || proCategoria) && promo.envaseIds.includes(item.envaseId)
};

// Cuantos pesos descuenta la promo sobre la linea. 0 si no la alcanza.
// No mira dias ni horario: eso lo resuleve vigencia.ts
export function descuentoDePromo(promo: PromoCalculo, item: ItemCarrito): number{
    if(!promoAlcanza(promo, item)) return 0;


    switch(promo.tipo){
        case "NXM": {
            if (promo.llevar === undefined || promo.pagar === undefined) return 0;
            const grupos = Math.floor(item.cantidad / promo.llevar);
            return grupos * (promo.llevar - promo.pagar) * item.precio
        }
        case "PORCENTAJE": {
            if (promo.porcentaje === undefined) return 0;
            return Math.floor((item.precio * item.cantidad * promo.porcentaje) / 100)
        }
        case "MONTO_FIJO": {
            if (promo.monto === undefined) return 0;
            return Math.min(promo.monto, item.precio) * item.cantidad
        }
    }
}