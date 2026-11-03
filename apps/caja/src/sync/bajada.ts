import axios from "axios";
import type { Vinculacion } from "../db/ajustes"
import { aplicarCambios, leerVersion } from "../db/catalogo";
import { pedirCambios } from "../lib/api"
const bajarDesde = async ({ apiUrl, token}: Vinculacion, desde: number, remplazar: boolean) => {
    const respuesta = await pedirCambios(apiUrl, token, desde);
    await aplicarCambios(respuesta, remplazar)
    // No se devuelve la respuesta entera: trae los pinHash y quedarían en la caché de TanStack Query
    return { version: respuesta.version, cajaNombre: respuesta.caja.nombre}
};

export const bajarCatalogo = async (vinculacion: Vinculacion) => {
    const desde = await leerVersion();
    try {
        return await bajarDesde(vinculacion, desde, false);
    } catch (error) {
        const hayConflicto = axios.isAxiosError(error) && error.response?.status === 409
        if(!hayConflicto) throw error;

        // La nube no conoce nuestra versión: se pide todo y se reemplaza el catálogo
        return bajarDesde(vinculacion, 0 , true)
        
    }
}