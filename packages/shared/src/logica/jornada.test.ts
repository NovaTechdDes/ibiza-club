import { describe, it, expect } from "vitest";
import { fechaOperativa, horaLocal, rangoJornada } from "./jornada.js";

describe("fechaOperativa", () => {
    it("viernes 23:30 es jornada del viernes", () => {
       expect(fechaOperativa(new Date("2026-10-30T23:30:00-03:00"))).toBe("2026-10-30")
    })
    it("Sabado 03:00 es jornada del viernes", () => {
       expect(fechaOperativa(new Date("2026-10-31T03:00:00-03:00"))).toBe("2026-10-30")
    })
    it("Sabado 09:59 es jornada del viernes", () => {
       expect(fechaOperativa(new Date("2026-10-31T09:59:00-03:00"))).toBe("2026-10-30")
    })
    it("Sabado 10:00 es jornada del sabado", () => {
       expect(fechaOperativa(new Date("2026-10-31T10:00:00-03:00"))).toBe("2026-10-31")
    })
    it("Domingo 1/11 01:00 es jornada del sabado 31/10 (cambio de mes)", () => {
       expect(fechaOperativa(new Date("2026-11-01T01:00:00-03:00"))).toBe("2026-10-31")
    })
    it("Jueves 1/1 05:00 es jornada del 31/12 (cambio de año)", () => {
       expect(fechaOperativa(new Date("2026-01-01T05:00:00-03:00"))).toBe("2025-12-31")
    })
    it("Con corte a las 6, sabado 07:00 es jornada del sabado", () => {
       expect(fechaOperativa(new Date("2026-10-31T07:00:00-03:00"), 6)).toBe("2026-10-31")
    })
    it("Con corte a las 6, sabado 05:59 es jornada del viernes", () => {
       expect(fechaOperativa(new Date("2026-10-31T05:59:00-03:00"), 6)).toBe("2026-10-30")
    })
    it("Un instante en UTC da la jornada argentina", () => {
       // 02:30 UTC del sabado = 23:30 del viernes en Argentina
       expect(fechaOperativa(new Date("2026-10-31T02:30:00Z"))).toBe("2026-10-30")
    })
})

describe("horaLocal", () => {
    it("Pasa un instante UTC a hora argentina", () => {
       expect(horaLocal(new Date("2026-10-31T02:30:00Z"))).toBe("23:30")
    })
    it("Respeta la hora escrita en -03:00", () => {
       expect(horaLocal(new Date("2026-10-31T01:05:00-03:00"))).toBe("01:05")
    })
    it("Medianoche es 00:00", () => {
       expect(horaLocal(new Date("2026-10-31T00:00:00-03:00"))).toBe("00:00")
    })
})

describe("rangoJornada", () => {
    it("La jornada del viernes va de las 10:00 del viernes a las 10:00 del sabado (hora argentina)", () => {
       const { inicio, fin } = rangoJornada("2026-10-30")
       expect(inicio.toISOString()).toBe("2026-10-30T13:00:00.000Z")
       expect(fin.toISOString()).toBe("2026-10-31T13:00:00.000Z")
    })
    it("Ida y vuelta con fechaOperativa: el inicio entra y el fin es de la jornada siguiente", () => {
       const { inicio, fin } = rangoJornada("2026-10-30")
       expect(fechaOperativa(inicio)).toBe("2026-10-30")
       expect(fechaOperativa(new Date(fin.getTime() - 1))).toBe("2026-10-30")
       expect(fechaOperativa(fin)).toBe("2026-10-31")
    })
    it("Cambio de mes: la jornada del 31/10 termina el 1/11", () => {
       expect(rangoJornada("2026-10-31").fin.toISOString()).toBe("2026-11-01T13:00:00.000Z")
    })
    it("Cambio de año: la jornada del 31/12 termina el 1/1", () => {
       const { inicio, fin } = rangoJornada("2026-12-31")
       expect(inicio.toISOString()).toBe("2026-12-31T13:00:00.000Z")
       expect(fin.toISOString()).toBe("2027-01-01T13:00:00.000Z")
    })
    it("Respeta otra hora de corte", () => {
       expect(rangoJornada("2026-10-30", 6).inicio.toISOString()).toBe("2026-10-30T09:00:00.000Z")
    })
})
