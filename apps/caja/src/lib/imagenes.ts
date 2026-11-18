import { convertFileSrc } from "@tauri-apps/api/core";
import { appDataDir, join } from "@tauri-apps/api/path";

const CARPETA = 'imagenes';

let carpeta: Promise<string> | null = null;
const obtenerCarpeta = () => {
    carpeta ??= appDataDir().then((dir) => join(dir, CARPETA));
    return carpeta;
};

const nombreArchivo = (url: string) => {
    try {
        return new URL(url).pathname.split("/").pop() || null;
    } catch (error) {
        return null;
    }
};

export const srcImagenLocal = async(url: string | null) => {
    if(!url) return null;
    const nombre = nombreArchivo(url);
    if(!nombre) return null;
    return convertFileSrc(await join(await obtenerCarpeta(), nombre))
}