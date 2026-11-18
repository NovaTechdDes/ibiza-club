import { invoke } from "@tauri-apps/api/core";
import { leerUrlsImagenes } from "../db/productos"

export const cachearImagenes = async() => {
    const urls = await leerUrlsImagenes();

    const fallidas = await invoke<number>("cachear_imagenes", { urls })

    if(fallidas > 0){
        console.warn(`No se pudieron bajar ${fallidas} imágenes; se reintenta en la próxima bajada`);
    }
}