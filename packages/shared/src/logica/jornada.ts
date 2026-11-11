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

// Lo mínimo de una apertura para saber a qué jornada pertenece
export type AperturaConFecha = {
    jornadaFecha: string | null;
    ocurridaEn: string;
};

// Fecha de la jornada de una apertura (YYYY-MM-DD).
// Con jornada activa se guardó al abrir; sin jornada se calcula desde la hora de apertura
export function fechaDeApertura(apertura: AperturaConFecha, horaCorte: number = HORA_CORTE_JORNADA): string {
    return apertura.jornadaFecha ?? fechaOperativa(new Date(apertura.ocurridaEn), horaCorte);
}

// Una apertura está vencida si es de otra jornada que la actual
// (ej: quedó abierta el viernes por un corte de luz y ya es sábado a la noche)
export function aperturaVencida(apertura: AperturaConFecha, ahora: Date = new Date(), horaCorte: number = HORA_CORTE_JORNADA): boolean {
    return fechaDeApertura(apertura, horaCorte) !== fechaOperativa(ahora, horaCorte);
}

export function rangoJornada(fecha: string, horaCorte = HORA_CORTE_JORNADA): {inicio: Date, fin: Date}{
    
    const [anio, mes, dia] = fecha.split('-').map(Number) as [number, number, number];
    const inicio = Date.UTC(anio, mes - 1, dia, horaCorte) - ZONA_HORARIA_MIN * 60_000;
    

    return {
        inicio: new Date(inicio),
        fin: new Date(inicio + DIA_MS)
    }
}