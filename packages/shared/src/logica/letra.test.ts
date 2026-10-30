import { describe, it, expect } from "vitest";
import { letraDeLaSemana, viernesDeLaSemana } from "./letra.js";
import { fechaOperativa } from "./jornada.js";
import { LETRAS_TICKET } from "../constantes.js";

const CLAVE = "clave-de-prueba";

// 8 viernes seguidos, para los tests que recorren varias semanas
const VIERNES = [
    "2026-10-30", "2026-11-06", "2026-11-13", "2026-11-20",
    "2026-11-27", "2026-12-04", "2026-12-11", "2026-12-18",
];

describe("viernesDeLaSemana", () => {
    it("Lunes 26/10 se ancla al viernes 30/10", () => {
        expect(viernesDeLaSemana("2026-10-26")).toBe("2026-10-30")
    })
    it("Viernes 30/10 se ancla a si mismo", () => {
        expect(viernesDeLaSemana("2026-10-30")).toBe("2026-10-30")
    })
    it("Sabado 31/10 se ancla al viernes 30/10", () => {
        expect(viernesDeLaSemana("2026-10-31")).toBe("2026-10-30")
    })
    it("Domingo 1/11 se ancla al viernes 30/10 (cambio de mes)", () => {
        expect(viernesDeLaSemana("2026-11-01")).toBe("2026-10-30")
    })
    it("Viernes 6/11 es otra semana", () => {
        expect(viernesDeLaSemana("2026-11-06")).toBe("2026-11-06")
    })
    it("Domingo 3/1/2027 se ancla al viernes 1/1/2027", () => {
        expect(viernesDeLaSemana("2027-01-03")).toBe("2027-01-01")
    })
    it("Lunes 29/12/2025 se ancla al viernes 2/1/2026 (cambio de año)", () => {
        expect(viernesDeLaSemana("2025-12-29")).toBe("2026-01-02")
    })
})

describe("letraDeLaSemana", () => {
    it("Fija el resultado: si cambia el algoritmo, las cajas dejan de coincidir", async () => {
        expect(await letraDeLaSemana("2026-10-30", CLAVE)).toBe("J")
        expect(await letraDeLaSemana("2026-11-06", CLAVE)).toBe("A")
    })
    it("Viernes y sabado de la misma semana dan la misma letra", async () => {
        expect(await letraDeLaSemana("2026-10-31", CLAVE))
            .toBe(await letraDeLaSemana("2026-10-30", CLAVE))
    })
    it("Sabado 03:00 tiene la letra del viernes (via fechaOperativa)", async () => {
        const fecha = fechaOperativa(new Date("2026-10-31T03:00:00-03:00"))
        expect(await letraDeLaSemana(fecha, CLAVE)).toBe("J")
    })
    it("Siempre devuelve una sola letra valida", async () => {
        for (const viernes of VIERNES) {
            const letra = await letraDeLaSemana(viernes, CLAVE)
            expect(letra).toHaveLength(1)
            expect(LETRAS_TICKET).toContain(letra)
        }
    })
    it("Con otra clave, las letras de varias semanas cambian", async () => {
        const conClave = await Promise.all(VIERNES.map(v => letraDeLaSemana(v, CLAVE)))
        const conOtra = await Promise.all(VIERNES.map(v => letraDeLaSemana(v, "otra-clave")))
        expect(conOtra).not.toEqual(conClave)
    })
})
