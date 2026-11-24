import { emitTo } from "@tauri-apps/api/event";
import type { LineaVenta } from "../hooks/useCarritoCalculado";

export const VENTANA_CLIENTE = 'cliente';
export const EVENTO_ENTRADA = 'cliente:entrada';
export const EVENTO_VENTA = "cliente:venta";


export type LineaCliente = {
    cantidad: number;
    nombre: string;
    imagen: string | null;
    subTotal: number;
    promocionNombre: string | null;
    descuento: number;
};

export type VentaCliente = {
    lineas: LineaCliente[];
    total: number;
};

// Sin segundo monitor no hay ventana y emitTo falla: no es un error.
// Devuelve void para que nadie lo espere con await dentro de un cobro.
const emitir = (evento: string, datos?: VentaCliente): void => {
    emitTo(VENTANA_CLIENTE, evento, datos).catch(() => {});
}

export const avisarEntradaVendida = (): void => emitir(EVENTO_ENTRADA);

export const avisarVentaBarra = (lineas: LineaVenta[], total: number): void => 
    emitir(EVENTO_VENTA, {
        lineas: lineas.map(linea => ({
            cantidad: linea.cantidad,
            nombre: `${linea.nombre} (${linea.envaseNombre})`,
            imagen: linea.imagen,
            subTotal: linea.subTotal,
            promocionNombre: linea.promocionNombre,
            descuento: linea.descuento
        })),
        total
    })