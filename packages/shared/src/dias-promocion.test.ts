import { describe, it, expect } from "vitest";
import { diasATexto, textoADias } from "./dias-promocion.js";

describe("diasATexto", () => {
    it("[5, 6] → \"5,6\"", () => {
        expect(diasATexto([5, 6])).toBe("5,6")
    })
    it("Un solo dia no lleva coma", () => {
        expect(diasATexto([4])).toBe("4")
    })
})

describe("textoADias", () => {
    it("\"5,6\" → [5, 6]", () => {
        expect(textoADias("5,6")).toEqual([5, 6])
    })
    it("Ida y vuelta da lo mismo", () => {
        const dias = [0, 1, 2, 3, 4, 5, 6]
        expect(textoADias(diasATexto(dias))).toEqual(dias)
    })
    it("Ignora lo que no es un dia valido", () => {
        expect(textoADias("5,7,-1,x,6")).toEqual([5, 6])
    })
    it("Los valores viejos sin convertir no dan ningun dia", () => {
        expect(textoADias("AMBOS")).toEqual([])
    })
    it("Texto vacio → []", () => {
        expect(textoADias("")).toEqual([])
    })
})
