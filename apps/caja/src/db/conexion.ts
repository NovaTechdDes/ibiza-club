
import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";


export type Sentencia = { sql: string; valores?: unknown[]}

let conexion: Promise<Database> | null = null;
// Cada load abre un pool nuevo: se guarda la promesa para abrir uno solo
export const obtenerDb = () => {
    conexion ??= Database.load("sqlite:ibiza.db");
    return conexion;
};

// Se guardan todas las sentencias o ninguna
export const transaccion = async (sentencias: Sentencia[]) => {
    await obtenerDb();// el comando necesita la base ya cargada
    await invoke('transaccion', { sentencias})
}