import { HORA_CORTE_JORNADA } from "../../constantes.js";
import { DiaPromocion } from "../../dias-promocion.js";
import { fechaOperativa, horaLocal } from "../jornada.js";
import { PromoCalculo } from "./descuento.js";

export function minutosDeJornada(hora: string, horaCorte: number = HORA_CORTE_JORNADA): number{
    const minutos = Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
    return (minutos - horaCorte * 60 + 1440) % 1440;
};

function diaVigente(dias: DiaPromocion, fecha: string): boolean {
    const dia = new Date(`${fecha}T00:00:00Z`).getUTCDay();
    if (dias === 'VIERNES') return dia === 5;
    if (dias === 'SABADO') return dia === 6;
    return dia === 5 || dia === 6;
}

// ¿La promo se aplica en este instante? Mira pausada, dia de la jornada y horario.
// El horario es [desde,  hasta]: "hasta 02:00" vale a las 1.59 y no a las 2
export function promoVigente(promo: PromoCalculo, instante: Date, horaCorte: number = HORA_CORTE_JORNADA): boolean {
    if (promo.pausada) return false;
    if (!diaVigente(promo.dias, fechaOperativa(instante, horaCorte))) return false;
    if (!promo.horaDesde || !promo.horaHasta) return true;

    const ahora = minutosDeJornada(horaLocal(instante), horaCorte);
    const desde = minutosDeJornada(promo.horaDesde, horaCorte);
    const hasta = minutosDeJornada(promo.horaHasta, horaCorte);
    return desde <= ahora && ahora < hasta;
}