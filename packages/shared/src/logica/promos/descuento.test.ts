import { describe, it, expect } from "vitest";
import { descuentoDePromo, promoAlcanza, type ItemCarrito, type PromoCalculo } from "./descuento.js";

// Fabricas: un objeto completo por defecto, y cada test pisa solo lo que le importa.
// Por defecto: 2x1 sobre el producto 10 (categoria 3) en vaso (envase 1), a $4.000.
const promo = (c: Partial<PromoCalculo> = {}): PromoCalculo => ({
    id: 1,
    nombre: "2x1",
    tipo: "NXM",
    llevar: 2,
    pagar: 1,
    dias: "AMBOS",
    pausada: false,
    productoIds: [10],
    categoriaIds: [],
    envaseIds: [1],
    ...c,
});

const item = (c: Partial<ItemCarrito> = {}): ItemCarrito => ({
    varianteId: 100,
    productoId: 10,
    categoriaId: 3,
    envaseId: 1,
    precio: 4000,
    cantidad: 2,
    ...c,
});

describe("promoAlcanza", () => {
    it("Alcanza por producto", () => {
        expect(promoAlcanza(promo(), item())).toBe(true)
    })
    it("Alcanza por categoria", () => {
        expect(promoAlcanza(promo({ productoIds: [], categoriaIds: [3] }), item())).toBe(true)
    })
    it("No alcanza si el envase no esta en la lista", () => {
        expect(promoAlcanza(promo(), item({ envaseId: 2 }))).toBe(false)
    })
    it("Alcanza si la promo incluye ambos envases", () => {
        expect(promoAlcanza(promo({ envaseIds: [1, 2] }), item({ envaseId: 2 }))).toBe(true)
    })
    it("No alcanza si no coincide ni el producto ni la categoria", () => {
        expect(promoAlcanza(promo(), item({ productoId: 99, categoriaId: 99 }))).toBe(false)
    })
})

describe("descuentoDePromo", () => {
    describe("NXM", () => {
        it.each([
            [1, 0],
            [2, 4000],
            [3, 4000],
            [4, 8000],
            [5, 8000],
        ])("2x1 con %i unidades descuenta %i", (cantidad, esperado) => {
            expect(descuentoDePromo(promo(), item({ cantidad }))).toBe(esperado)
        })
        it("3x2 con 3 unidades regala 1", () => {
            expect(descuentoDePromo(promo({ llevar: 3, pagar: 2 }), item({ cantidad: 3 }))).toBe(4000)
        })
        it("3x2 con 6 unidades regala 2", () => {
            expect(descuentoDePromo(promo({ llevar: 3, pagar: 2 }), item({ cantidad: 6 }))).toBe(8000)
        })
        it("Sin llevar cargado no descuenta", () => {
            expect(descuentoDePromo(promo({ llevar: undefined }), item())).toBe(0)
        })
    })

    describe("PORCENTAJE", () => {
        const porcentaje = (p: number) =>
            promo({ tipo: "PORCENTAJE", llevar: undefined, pagar: undefined, porcentaje: p })

        it("10% sobre 2 x $4.000 descuenta $800", () => {
            expect(descuentoDePromo(porcentaje(10), item())).toBe(800)
        })
        it("Redondea para abajo: 15% de $3.333 descuenta $499", () => {
            expect(descuentoDePromo(porcentaje(15), item({ precio: 3333, cantidad: 1 }))).toBe(499)
        })
        it("100% descuenta todo", () => {
            expect(descuentoDePromo(porcentaje(100), item())).toBe(8000)
        })
    })

    describe("MONTO_FIJO", () => {
        const montoFijo = (m: number) =>
            promo({ tipo: "MONTO_FIJO", llevar: undefined, pagar: undefined, monto: m })

        it("$500 por unidad sobre 2 unidades descuenta $1.000", () => {
            expect(descuentoDePromo(montoFijo(500), item())).toBe(1000)
        })
        it("Un monto mayor al precio descuenta como mucho el precio", () => {
            expect(descuentoDePromo(montoFijo(5000), item())).toBe(8000)
        })
    })

    it("Si la promo no alcanza al item, descuenta 0", () => {
        expect(descuentoDePromo(promo(), item({ envaseId: 2 }))).toBe(0)
    })
})
