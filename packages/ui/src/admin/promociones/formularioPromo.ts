import { PromocionInputSchema, type TipoPromocion } from "@ibiza/shared";
import type { PromocionListada } from "./usePromociones";

export type FormularioPromo = {
    nombre: string;
    tipo: TipoPromocion;
    llevar: string;
    pagar: string;
    porcentaje: string;
    monto: string;
    dias: number[];
    todaLaNoche: boolean;
    horaDesde: string;
    horaHasta: string;
    pausada: boolean;
    productoIds: number[];
    categoriaIds: number[];
    envaseIds: number[];
};

// Lo más común: 2x1 viernes y sábado, toda la noche.
export const PROMO_VACIA: FormularioPromo = {
    nombre: "",
    tipo: "NXM",
    llevar: "2",
    pagar: "1",
    porcentaje: "",
    monto: "",
    dias: [5, 6],
    todaLaNoche: true,
    horaDesde: "",
    horaHasta: "",
    pausada: false,
    productoIds: [],
    categoriaIds: [],
    envaseIds: [],
};

const aTexto = (n: number | null) => (n === null ? "" : String(n));
const aNumero = (texto: string) => (texto.trim() === "" ? undefined : Number(texto));

export const desdePromo = (promo: PromocionListada): FormularioPromo => ({
    nombre: promo.nombre,
    tipo: promo.tipo,
    llevar: aTexto(promo.llevar),
    pagar: aTexto(promo.pagar),
    porcentaje: aTexto(promo.porcentaje),
    monto: aTexto(promo.monto),
    dias: promo.dias,
    todaLaNoche: promo.horaDesde === null,
    horaDesde: promo.horaDesde ?? "",
    horaHasta: promo.horaHasta ?? "",
    pausada: promo.pausada,
    productoIds: promo.productoIds,
    categoriaIds: promo.categoriaIds,
    envaseIds: promo.envaseIds,
});

// Valida con el mismo schema que la API. Solo manda los valores del tipo elegido:
// el schema rechaza los que sobran (ej. un porcentaje en un 2x1).
export const validarPromo = (form: FormularioPromo) =>
    PromocionInputSchema.safeParse({
        nombre: form.nombre,
        tipo: form.tipo,
        llevar: form.tipo === "NXM" ? aNumero(form.llevar) : undefined,
        pagar: form.tipo === "NXM" ? aNumero(form.pagar) : undefined,
        porcentaje: form.tipo === "PORCENTAJE" ? aNumero(form.porcentaje) : undefined,
        monto: form.tipo === "MONTO_FIJO" ? aNumero(form.monto) : undefined,
        dias: form.dias,
        horaDesde: form.todaLaNoche ? null : form.horaDesde,
        horaHasta: form.todaLaNoche ? null : form.horaHasta,
        pausada: form.pausada,
        productoIds: form.productoIds,
        categoriaIds: form.categoriaIds,
        envaseIds: form.envaseIds,
    });