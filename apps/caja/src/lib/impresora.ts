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

export const imprimirTicket = (ip: string, puerto: number, ancho: number, ticket: Ticket) =>
    invoke<void>("imprimir_ticket", { ip, puerto, ancho, ticket });

export const imprimirPrueba = (ip: string, puerto: number) =>
    invoke<void>("imprimir_prueba", { ip, puerto });

// Se llama con la venta ya guardada: por eso NUNCA tira error, solo avisa y deja reintentar
export const imprimirConReintento = async (config: ConfigImpresora | null, ticket: Ticket) => {
    if (!config) {
        await avisaError(`Esta PC no tiene impresora configurada. La venta #${ticket.numero} quedó guardada sin ticket.`);
        return;
    }

    while (true) {
        try {
            await imprimirTicket(config.ip, config.puerto, config.ancho, ticket);
            return;
        } catch (error) {
            const reintentar = await preguntarReintento(
                `No se imprimió el ticket #${ticket.numero}`,
                `${String(error)}. La venta ya quedó guardada.`
            );
            if (!reintentar) return;
        }
    }
};
