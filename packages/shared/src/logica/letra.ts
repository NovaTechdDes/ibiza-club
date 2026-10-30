// La semana va de lunes a domingo y todas sus fechas se anclan a su viernes

import { LETRAS_TICKET } from "../constantes.js";

// Recibe y devuelve "YYYY-MM-DD" (La fecha operativa , no la del calendario)
export function viernesDeLaSemana(fecha: string): string{
    const dia = new Date(`${fecha}T00:00:00Z`);
    const diaSemana = dia.getUTCDay();
    const desplazamiento = 5 - (diaSemana === 0 ? 7 : diaSemana);
    dia.setUTCDate(dia.getUTCDate() + desplazamiento);
    return dia.toISOString().slice(0, 10)
};

// Letra de la semana: HMAC-SHA256 del viernes con la clave secreta, pasado a una letra
// Todas las cajas con la misma clave llegan a la misma letra sin comunicarse.
export async function letraDeLaSemana(fecha: string, clave: string): Promise<string>{
    const codificador = new TextEncoder();
    const llave = await crypto.subtle.importKey(
        "raw", codificador.encode(clave), {name: 'HMAC', hash: "SHA-256"}, false, ["sign"]
    );
    const firma = await crypto.subtle.sign("HMAC", llave, codificador.encode(viernesDeLaSemana(fecha)))
    const numero = new DataView(firma).getUint32(0);
    return LETRAS_TICKET.charAt(numero % LETRAS_TICKET.length)
}