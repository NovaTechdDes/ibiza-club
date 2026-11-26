import { emitTo } from "@tauri-apps/api/event";
import type { LineaVenta } from "../hooks/useCarritoCalculado";

export const VENTANA_CLIENTE = 'cliente';
export const EVENTO_ENTRADA = 'cliente:entrada';
export const EVENTO_VENTA = "cliente:venta";
export const EVENTO_CARRITO = "cliente:carrito";
export const EVENTO_QR = "cliente:qr";


export type LineaCliente = {
    varianteId: number;
    cantidad: number;
    nombre: string;
    imagen: string | null;
    subTotal: number;
    promocionNombre: string | null;
    descuento: number;
};

export type CarritoCliente = {
    lineas: LineaCliente[];
    total: number;
};

export type QrCliente = {
    qrData: string;
    total: number;
};

// Sin segundo monitor no hay ventana y emitTo falla: no es un error.
// Devuelve void para que nadie lo espere con await dentro de un cobro.
const emitir = (evento: string, datos?: CarritoCliente | QrCliente | null): void => {
    emitTo(VENTANA_CLIENTE, evento, datos).catch(() => {});
}

export const avisarEntradaVendida = (): void => emitir(EVENTO_ENTRADA);

export const avisarVentaBarra = (): void => emitir(EVENTO_VENTA)

export const aCarritoCliente = (lineas: LineaVenta[], total: number): CarritoCliente => ({
        lineas: lineas.map(linea => ({
            varianteId: linea.varianteId,
            cantidad: linea.cantidad,
            nombre: `${linea.nombre} (${linea.envaseNombre})`,
            imagen: linea.imagen,
            subTotal: linea.subTotal,
            promocionNombre: linea.promocionNombre,
            descuento: linea.descuento
        })),
        total,
});


export const mostrarCarrito = (carrito: CarritoCliente): void => emitir(EVENTO_CARRITO, carrito);

export const mostrarQr = (qr: QrCliente | null): void => emitir(EVENTO_QR, qr);