import { TAMANO_LOTE } from "@ibiza/shared";
import type { Vinculacion } from "../db/ajustes";
import { leerLote, marcarConfirmadas, marcarRechazada, type Rechazada } from "../db/cola";
import { enviarLote } from "../lib/api";
export type ResultadoSubida ={subidas: number; rechazada: Rechazada | null};

export const subirPendientes = async({apiUrl, token}: Vinculacion): Promise<ResultadoSubida> => {
    let subidas = 0;

    while (true){
        const operaciones = await leerLote();

        if(operaciones.length === 0) return {
            subidas, rechazada: null
        }

        const { confirmadas, rechazada} = await enviarLote(apiUrl, token, operaciones);

        await marcarConfirmadas(confirmadas);
        subidas += confirmadas.length

        if(rechazada){
            await marcarRechazada(rechazada);
            return {
                subidas, rechazada
            }
        }

        if(operaciones.length < TAMANO_LOTE) return {subidas, rechazada: null}

        
    }
}