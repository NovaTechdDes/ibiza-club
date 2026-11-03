
import { Rol } from "@ibiza/shared";
import { invoke } from "@tauri-apps/api/core";
import { obtenerDb } from "./conexion"

export type Usuario = {
    nombre: string;
    id: number;
    rol: Rol
}

export const leerUsuarios = async() => {
    const db = await obtenerDb();
    const filas = await db.select<Usuario[]>(
        "SELECT id, nombre, rol FROM Usuario WHERE activo = 1 ORDER BY nombre"
    );
    return filas;
}

export const verificarPin = async(id: number, pin: string) => {
    const db = await obtenerDb();
    const filas = await db.select<{pinHash: string}[]>(
        "SELECT pinHash FROM Usuario WHERE id = $1 AND activo = 1", [id]
    )
    if(!filas[0]) return false;


    return invoke<boolean>("verificar_pin", {pin, pinHash: filas[0].pinHash})
}