import { useEffect } from "react";
import { aCarritoCliente, mostrarCarrito } from "../lib/pantallaCliente";
import { type LineaVenta } from "./useCarritoCalculado";

export const useCarritoEnPantallaCliente = (lineas: LineaVenta[], total: number, activo: boolean): void => {
    const clave = JSON.stringify(aCarritoCliente(lineas, total));

    useEffect(() => {
        if (activo) mostrarCarrito(JSON.parse(clave));
    }, [clave, activo])
}