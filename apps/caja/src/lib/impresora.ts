import { invoke } from "@tauri-apps/api/core";

import type { ConfigImpresora } from "../db/ajustes";
import { avisaError, preguntarReintento } from "./alertas";

// Mismos campos que los structs de ticket.rs, en camelCase (serde los traduce)
export type LineaTicket = {
    cantidad: number;
    nombre: string;
    precioUnitario: number;
    promocionNombre: string | null;
    descuento: number;
};

export type Ticket = {
    letra: string;
    fecha: string;
    caja: string;
    numero: number;
    lineas: LineaTicket[];
    total: number;
    medioPago: string;
    hora: string;
};

export type Retiro = {
    numero: number,
    caja: string,
    fecha: string,
    hora: string,
    monto: number,
    motivo: string,
    cajero: string,
    autorizo: string,
}

type Impresion = {
    titulo: string;
    aclaracion: string;
    imprimir: (config: ConfigImpresora) => Promise<void>
}

export const imprimirTicket = (ip: string, puerto: number, ancho: number, ticket: Ticket) =>
    invoke<void>("imprimir_ticket", { ip, puerto, ancho, ticket });

export const imprimirRetiro = (ip: string, puerto: number, ancho: number, retiro: Retiro) =>
    invoke<void>('imprimir_retiro', {ip, puerto, ancho, retiro})

export const imprimirPrueba = (ip: string, puerto: number) =>
    invoke<void>("imprimir_prueba", { ip, puerto });

// Se llama con la operación ya guardada (venta, retiro...): por eso NUNCA tira error,
// solo avisa y deja reintentar. No sabe qué imprime: eso lo decide quien la llama.
export const imprimirConReintento = async (
    config: ConfigImpresora | null,
    { titulo, aclaracion, imprimir }: Impresion,
) => {
    if (!config) {
        await avisaError(`Esta PC no tiene impresora configurada. ${aclaracion}`);
        return;
    }

    while (true) {
        try {
            await imprimir(config);
            return;
        } catch (error) {
            const reintentar = await preguntarReintento(titulo, `${String(error)}. ${aclaracion}`);
            if (!reintentar) return;
        }
    }
};
