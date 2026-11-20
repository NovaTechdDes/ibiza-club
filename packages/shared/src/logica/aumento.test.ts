import { describe, it, expect } from "vitest";
import { aplicarAumento } from "./aumento.js";

describe("aplicarAumento", () => {
    it("Con 0 % el precio queda igual, aunque no sea multiplo de 100", () => {
        expect(aplicarAumento(8000, 0)).toBe(8000)
        expect(aplicarAumento(8050, 0)).toBe(8050)
    })
    it("Si el resultado ya es multiplo de 100, no redondea", () => {
        expect(aplicarAumento(8000, 15)).toBe(9200)
        expect(aplicarAumento(8000, 100)).toBe(16000)
    })
    it("Redondea hacia arriba a $100", () => {
        expect(aplicarAumento(6000, 7)).toBe(6500)   // 6420
        expect(aplicarAumento(4500, 10)).toBe(5000)  // 4950
        expect(aplicarAumento(1100, 10)).toBe(1300)  // 1210
    })
    it("No le suma $100 de mas por errores de decimales", () => {
        // Con 3000 * 1.1 = 3300.0000000000005 el redondeo daria 3400
        expect(aplicarAumento(3000, 10)).toBe(3300)
        expect(aplicarAumento(2500, 12)).toBe(2800)
        expect(aplicarAumento(5000, 62)).toBe(8100)
    })
    it("Precio 0 sigue en 0", () => {
        expect(aplicarAumento(0, 20)).toBe(0)
    })
    it("Siempre devuelve un entero", () => {
        for (const porcentaje of [1, 3, 7, 13, 33, 99]) {
            expect(Number.isInteger(aplicarAumento(8750, porcentaje))).toBe(true)
        }
    })
})
