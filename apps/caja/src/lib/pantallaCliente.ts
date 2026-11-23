import { emitTo } from "@tauri-apps/api/event";

export const VENTANA_CLIENTE = 'cliente';
export const EVENTO_ENTRADA = 'cliente:entrada';


export const avisarEntradaVendida = (): void => {
    emitTo(VENTANA_CLIENTE, EVENTO_ENTRADA)
    .catch(() => {

    })
}