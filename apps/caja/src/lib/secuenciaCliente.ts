import type { LineaCliente, VentaCliente } from "./pantallaCliente";

export type Modo =
    | { tipo: "logo" }
    | { tipo: "entrada" }
    | { tipo: "venta"; venta: VentaCliente; actual: LineaCliente | null; enLista: number }
    | { tipo: "gracias" };

export type Paso = { modo: Modo; duracion: number };

const DURACION_ENTRADA = 6000;
const POR_LINEA_MAX = 1500;
const POR_LINEA_MIN = 600;
const SECUENCIA_MAX = 8000;
const LISTA_COMPLETA = 4000;
const GRACIAS = 4000;

// Con muchas líneas se acorta cada una para que la secuencia no pase de 8 s, sin bajar de 0,6 s
export const duracionPorLinea = (cantidadLineas: number): number =>
    Math.round(
        Math.min(POR_LINEA_MAX, Math.max(POR_LINEA_MIN, SECUENCIA_MAX / cantidadLineas)),
    );

export const pasosDeEntrada = (): Paso[] => [
    { modo: { tipo: "entrada" }, duracion: DURACION_ENTRADA },
];

export const pasosDeVenta = (venta: VentaCliente): Paso[] => {
    const porLinea = duracionPorLinea(venta.lineas.length);

    // Mientras la línea i sale grande, la lista muestra solo las anteriores
    const lineas = venta.lineas.map(
        (linea, i): Paso => ({
            modo: { tipo: "venta", venta, actual: linea, enLista: i },
            duracion: porLinea,
        }),
    );

    return [
        ...lineas,
        {
            modo: { tipo: "venta", venta, actual: null, enLista: venta.lineas.length },
            duracion: LISTA_COMPLETA,
        },
        { modo: { tipo: "gracias" }, duracion: GRACIAS },
    ];
};
