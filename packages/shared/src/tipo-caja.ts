import type{ Seccion } from "./seccion.js";

export const TIPOS_CAJA = ["BARRA", "ENTRADA"] as const;
export type TipoCaja = (typeof TIPOS_CAJA)[number];

export const NOMBRE_TIPO_CAJA: Record<TipoCaja, string> = {
    BARRA: "Barra",
    ENTRADA: "Entrada"
};

export const SECCIONES_POR_TIPO: Record<TipoCaja, readonly Seccion[]> = {
    BARRA: ["BEBIDA", "COMIDA"],
    ENTRADA: ["ENTRADA"]
}