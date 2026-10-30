// Corre el instante a hora argentina. El resultado se lee con getURC*
// asi da lo mismo en que zona horaria esté la pc o el servidor

import { HORA_CORTE_JORNADA, ZONA_HORARIA_MIN } from "../constantes.js";

function aHoraArgentina(instante: Date): Date{
    return new Date(instante.getTime() + ZONA_HORARIA_MIN * 60_000)
};

// Devuelve la fecha de la jornada (YYYy-MM-DD) a la que pertenece el instante
export function fechaOperativa(instante: Date, horaCorte: number = HORA_CORTE_JORNADA): string {
    const local = aHoraArgentina(instante);
    if(local.getUTCHours() < horaCorte){
        local.setUTCDate(local.getUTCDate() - 1)
    }
    return local.toISOString().slice(0, 10)
};


// Hora argentina del instnante en formato "HH:MM" (la misma que usan las promos)
export function horaLocal(instante: Date): string {
    return aHoraArgentina(instante).toISOString().slice(11, 16)
}