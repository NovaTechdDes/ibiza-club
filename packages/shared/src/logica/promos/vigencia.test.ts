import { describe, it, expect } from "vitest";
import { minutosDeJornada, promoVigente } from "./vigencia.js";
import type { PromoCalculo } from "./descuento.js";

// Por defecto: 2x1 los viernes, toda la noche, no pausada.
const promo = (c: Partial<PromoCalculo> = {}): PromoCalculo => ({
    id: 1,
    nombre: "2x1",
    tipo: "NXM",
    llevar: 2,
    pagar: 1,
    dias: [5],
    horaDesde: null,
    horaHasta: null,
    pausada: false,
    productoIds: [10],
    categoriaIds: [],
    envaseIds: [1],
    ...c,
});

// Instante en hora argentina: en("2026-10-30", "23:00")
const en = (fecha: string, hora: string) => new Date(`${fecha}T${hora}:00-03:00`);

const VIERNES = "2026-10-30";
const SABADO = "2026-10-31";
const DOMINGO = "2026-11-01";
const JUEVES = "2026-10-29";
const MARTES = "2026-10-27";

describe("minutosDeJornada", () => {
    it.each([
        ["10:00", 0],
        ["23:00", 780],
        ["01:59", 959],
        ["02:00", 960],
        ["09:59", 1439],
    ])("Con corte a las 10, %s son %i minutos", (hora, esperado) => {
        expect(minutosDeJornada(hora)).toBe(esperado)
    })
    it("Con corte a las 6, 02:00 son 1200 minutos", () => {
        expect(minutosDeJornada("02:00", 6)).toBe(1200)
    })
})

describe("promoVigente", () => {
    describe("Pausada", () => {
        it("Una promo pausada no se aplica aunque coincida todo lo demas", () => {
            expect(promoVigente(promo({ pausada: true }), en(VIERNES, "23:00"))).toBe(false)
        })
    })

    describe("Dias", () => {
        it("[5] se aplica el viernes 23:00", () => {
            expect(promoVigente(promo(), en(VIERNES, "23:00"))).toBe(true)
        })
        it("[5] no se aplica el sabado 23:00", () => {
            expect(promoVigente(promo(), en(SABADO, "23:00"))).toBe(false)
        })
        it("[5] se aplica el sabado 03:00 (sigue siendo la jornada del viernes)", () => {
            expect(promoVigente(promo(), en(SABADO, "03:00"))).toBe(true)
        })
        it("[6] se aplica el domingo 03:00", () => {
            expect(promoVigente(promo({ dias: [6] }), en(DOMINGO, "03:00"))).toBe(true)
        })
        it("[6] no se aplica el viernes 23:00", () => {
            expect(promoVigente(promo({ dias: [6] }), en(VIERNES, "23:00"))).toBe(false)
        })
        it("[5, 6] se aplica viernes y sabado", () => {
            expect(promoVigente(promo({ dias: [5, 6] }), en(VIERNES, "23:00"))).toBe(true)
            expect(promoVigente(promo({ dias: [5, 6] }), en(SABADO, "23:00"))).toBe(true)
        })
        it("[5, 6] no se aplica el jueves 23:00", () => {
            expect(promoVigente(promo({ dias: [5, 6] }), en(JUEVES, "23:00"))).toBe(false)
        })
        it("Jueves feriado: [4] se aplica el jueves 23:00", () => {
            expect(promoVigente(promo({ dias: [4] }), en(JUEVES, "23:00"))).toBe(true)
        })
        it("El viernes 03:00 sigue siendo la jornada del jueves", () => {
            expect(promoVigente(promo({ dias: [4] }), en(VIERNES, "03:00"))).toBe(true)
            expect(promoVigente(promo({ dias: [5] }), en(VIERNES, "03:00"))).toBe(false)
        })
        it("Todos los dias se aplica un martes", () => {
            expect(promoVigente(promo({ dias: [0, 1, 2, 3, 4, 5, 6] }), en(MARTES, "23:00"))).toBe(true)
        })
        it("El domingo es 0", () => {
            expect(promoVigente(promo({ dias: [0] }), en(DOMINGO, "23:00"))).toBe(true)
        })
    })

    describe("Horario de 23:00 a 02:00", () => {
        const conHorario = promo({ horaDesde: "23:00", horaHasta: "02:00" })

        it.each([
            [VIERNES, "22:59", false],
            [VIERNES, "23:00", true],  // desde es inclusive
            [SABADO, "00:30", true],   // cruzo la medianoche
            [SABADO, "01:59", true],
            [SABADO, "02:00", false],  // hasta es exclusive
        ])("%s %s → %s", (fecha, hora, esperado) => {
            expect(promoVigente(conHorario, en(fecha, hora))).toBe(esperado)
        })
    })

    describe("Sin horario", () => {
        it("Vale al principio de la noche", () => {
            expect(promoVigente(promo(), en(VIERNES, "19:00"))).toBe(true)
        })
        it("Vale hasta el final de la jornada", () => {
            expect(promoVigente(promo(), en(SABADO, "09:00"))).toBe(true)
        })
    })

    it("Respeta otra hora de corte: con corte a las 6, el sabado 07:00 ya es sabado", () => {
        expect(promoVigente(promo(), en(SABADO, "07:00"), 6)).toBe(false)
        expect(promoVigente(promo({ dias: [6] }), en(SABADO, "07:00"), 6)).toBe(true)
    })
})
