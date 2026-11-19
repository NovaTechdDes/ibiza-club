import { invoke } from "@tauri-apps/api/core"
import type { Vinculacion } from "../db/ajustes"

export const buscarActualizacion = ({ apiUrl, token}: Vinculacion) => 
    invoke<string | null>("buscar_actualizacion", { apiUrl, token})

export const instalarActualizacion = () => 
    invoke<void>("instalar_actualizacion")