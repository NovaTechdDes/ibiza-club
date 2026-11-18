import { BlobServiceClient } from "@azure/storage-blob";

import { env } from '../config/env.js'
import { AppError } from "../errors/app-error.js";
import { randomUUID } from "node:crypto";

const contenedor = BlobServiceClient.fromConnectionString(env.AZURE_STORAGE_CONNECTION_STRING).getContainerClient(env.AZURE_STORAGE_CONTENEDOR)

export const TAMANIO_MAXIMO_IMAGEN = 2 * 1024 * 1024;

const detectarFormato = (datos: Buffer) => {
    if(datos[0] === 0xff && datos[1] === 0xd8 && datos[2] === 0xff){
        return { tipo: "image/jpeg", extension: "jpg"}
    };
    if(datos.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))){
        return {tipo: "image/png", extension: "png"}
    }
    if(datos.subarray(0, 4).toString("ascii") === "RIFF" && datos.subarray(8, 12).toString("ascii") === "WEBP"){
        return { tipo: "image/webp", extension: "webp"}
    }
    return null;
};



export const subirImagenProducto = async(productoId: number, datos: Buffer): Promise<string> => {
    const formato = detectarFormato(datos);
    if(!formato){
        throw new AppError(400, "VALIDACION", "La imagen tiene que ser JPG, PNG o WEBP");
    };

    const blob = contenedor.getBlockBlobClient(`producto-${productoId}-${randomUUID()}.${formato.extension}`);
    await blob.uploadData(datos, {
        blobHTTPHeaders: {
            blobContentType: formato.tipo,
            blobCacheControl: "public, max-age=31536000, immutable"
        }
    });
    return blob.url;
};

export const borrarImagen = async( url: string) => {
    const prefijo = contenedor.url + "/";
    if(!url.startsWith(prefijo)) return;
    await contenedor.getBlockBlobClient(decodeURIComponent(url.slice(prefijo.length))).deleteIfExists();
}