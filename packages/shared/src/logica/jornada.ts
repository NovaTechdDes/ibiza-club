// Corre el instante a hora argentina. El resultado se lee con getURC*
// asi da lo mismo en que zona horaria esté la pc o el servidor

import { HORA_CORTE_JORNADA, ZONA_HORARIA_MIN } from "../constantes.js";
const DIA_MS = 24 * 60 * 60_000;

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

export function rangoJornada(fecha: string, horaCorte = HORA_CORTE_JORNADA): {inicio: Date, fin: Date}{
    
    const [anio, mes, dia] = fecha.split('-').map(Number) as [number, number, number];
    const inicio = Date.UTC(anio, mes - 1, dia, horaCorte) - ZONA_HORARIA_MIN * 60_000;
    

    return {
        inicio: new Date(inicio),
        fin: new Date(inicio + DIA_MS)
    }
}