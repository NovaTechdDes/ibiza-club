export const SECCIONES = ["BEBIDA", "COMIDA", "ENTRADA"] as const;
export type Seccion = (typeof SECCIONES)[number];


export const NOMBRE_SECCION: Record<Seccion, string> = {
    BEBIDA: "Bebidas",
    COMIDA: "Comidas",
    ENTRADA: "Entradas"
};