export const SECCIONES = ["BEBIDA", "COMIDA"] as const;
export type Seccion = (typeof SECCIONES)[number];


export const NOMBRE_SECCION: Record<Seccion, string> = {
    BEBIDA: "Bebidas",
    COMIDA: "Comidas"
};