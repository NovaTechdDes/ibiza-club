import { fechaOperativa, letraDeLaSemana } from "@ibiza/shared"
import type { Jornada } from "../db/apertura"

export const calcularJornada = async (instante: Date, claveLetra: string): Promise<Jornada> => {
    const fecha = fechaOperativa(instante);
    const letra = await letraDeLaSemana(fecha, claveLetra);

    return { fecha, letra};
};