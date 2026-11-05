import { invoke } from "@tauri-apps/api/core";

export type LineaTicket = {
    cantidad: number;
    nombre: String;
    precioUnitario: number;
    promocionNombre?: string | null;
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

export const imprimirTicket = (ip: string, puerto: number, ancho: number, ticket: Ticket) => {

    return invoke<void>("imprimir_ticket", {ip, puerto, ancho, ticket})

};

export const imprimirPrueba = (ip: string, puerto: number) => {
    
    return invoke<void>("imprimir_prueba", {ip, puerto})

}