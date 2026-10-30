import { describe, it, expect } from "vitest";
import { agruparLineas, aplicarPromos } from "./aplicar.js";
import type { ItemCarrito, PromoCalculo } from "./descuento.js";

// Por defecto: 2x1 sobre el producto 10 en vaso, viernes y sabado, toda la noche.
const promo = (c: Partial<PromoCalculo> = {}): PromoCalculo => ({
    id: 1,
    nombre: "2x1",
    tipo: "NXM",
    llevar: 2,
    pagar: 1,
    dias: "AMBOS",
    horaDesde: null,
    horaHasta: null,
    pausada: false,
    productoIds: [10],
    categoriaIds: [],
    envaseIds: [1],
    ...c,
});

const porcentaje = (p: number, c: Partial<PromoCalculo> = {}) =>
    promo({ nombre: `${p}%`, tipo: "PORCENTAJE", llevar: undefined, pagar: undefined, porcentaje: p, ...c });

// Por defecto: 1 vodka (producto 10, categoria 3) en vaso a $4.000.
const item = (c: Partial<ItemCarrito> = {}): ItemCarrito => ({
    varianteId: 100,
    productoId: 10,
    categoriaId: 3,
    envaseId: 1,
    precio: 4000,
    cantidad: 1,
    ...c,
});

// Una cerveza: otro producto, otra categoria, mismo envase
const cerveza = (c: Partial<ItemCarrito> = {}) =>
    item({ varianteId: 200, productoId: 20, categoriaId: 5, precio: 3000, ...c });

const en = (fecha: string, hora: string) => new Date(`${fecha}T${hora}:00-03:00`);
const VIERNES_23 = en("2026-10-30", "23:00");

describe("agruparLineas", () => {
    it("Junta los items de la misma variante sumando cantidades", () => {
        const lineas = agruparLineas([item({ cantidad: 1 }), item({ cantidad: 2 })])
        expect(lineas).toHaveLength(1)
        expect(lineas[0]?.cantidad).toBe(3)
    })
    it("Deja separadas las variantes distintas, en el orden original", () => {
        const lineas = agruparLineas([cerveza(), item(), cerveza()])
        expect(lineas.map(l => l.varianteId)).toEqual([200, 100])
        expect(lineas[0]?.cantidad).toBe(2)
    })
    it("No modifica los items que recibe", () => {
        const primero = item({ cantidad: 1 })
        agruparLineas([primero, item({ cantidad: 2 })])
        expect(primero.cantidad).toBe(1)
    })
})

describe("aplicarPromos", () => {
    it("Carrito vacio da todo en cero", () => {
        expect(aplicarPromos([], [promo()], VIERNES_23))
            .toEqual({ lineas: [], subTotal: 0, descuento: 0, total: 0 })
    })

    it("Sin promos, el total es el subtotal y la linea no tiene promo", () => {
        const r = aplicarPromos([item({ cantidad: 2 })], [], VIERNES_23)
        expect(r.lineas[0]).toMatchObject({ subTotal: 8000, promocionId: null, promocionNombre: null, descuento: 0 })
        expect(r).toMatchObject({ subTotal: 8000, descuento: 0, total: 8000 })
    })

    it("El 2x1 se aplica al juntar dos toques sueltos del mismo producto", () => {
        const r = aplicarPromos([item(), item()], [promo()], VIERNES_23)
        expect(r.lineas).toHaveLength(1)
        expect(r.lineas[0]).toMatchObject({ cantidad: 2, promocionId: 1, promocionNombre: "2x1", descuento: 4000 })
        expect(r.total).toBe(4000)
    })

    describe("Gana la mas conveniente (no se acumulan)", () => {
        it("Con 2 unidades, el 2x1 ($4.000) le gana al 10% ($800)", () => {
            const r = aplicarPromos([item({ cantidad: 2 })], [promo(), porcentaje(10, { id: 2 })], VIERNES_23)
            expect(r.lineas[0]).toMatchObject({ promocionId: 1, descuento: 4000 })
        })
        it("Con 1 unidad, el 2x1 no descuenta y gana el 10%", () => {
            const r = aplicarPromos([item({ cantidad: 1 })], [promo(), porcentaje(10, { id: 2 })], VIERNES_23)
            expect(r.lineas[0]).toMatchObject({ promocionId: 2, promocionNombre: "10%", descuento: 400 })
        })
        it("Nunca suma dos promos sobre la misma linea", () => {
            const r = aplicarPromos([item({ cantidad: 2 })], [promo(), porcentaje(10, { id: 2 })], VIERNES_23)
            expect(r.descuento).toBe(4000)
        })
        it("Ante empate gana la de menor id, aunque venga segunda", () => {
            const r = aplicarPromos(
                [item({ cantidad: 2 })],
                [porcentaje(10, { id: 7 }), porcentaje(10, { id: 3 })],
                VIERNES_23,
            )
            expect(r.lineas[0]?.promocionId).toBe(3)
        })
    })

    describe("Promos no vigentes", () => {
        it("Una promo pausada no se aplica", () => {
            const r = aplicarPromos([item({ cantidad: 2 })], [promo({ pausada: true })], VIERNES_23)
            expect(r.descuento).toBe(0)
        })
        it("Una promo de 23:00 a 02:00 no se aplica a las 03:00", () => {
            const r = aplicarPromos(
                [item({ cantidad: 2 })],
                [promo({ horaDesde: "23:00", horaHasta: "02:00" })],
                en("2026-10-31", "03:00"),
            )
            expect(r.descuento).toBe(0)
        })
        it("Si la mejor no esta vigente, gana la siguiente", () => {
            const r = aplicarPromos(
                [item({ cantidad: 2 })],
                [promo({ pausada: true }), porcentaje(10, { id: 2 })],
                VIERNES_23,
            )
            expect(r.lineas[0]).toMatchObject({ promocionId: 2, descuento: 800 })
        })
    })

    it("Cada linea elige su promo y los totales cierran", () => {
        // 2 vodkas con 2x1 por producto + 2 cervezas con 10% por categoria
        const r = aplicarPromos(
            [item({ cantidad: 2 }), cerveza({ cantidad: 2 })],
            [promo(), porcentaje(10, { id: 2, productoIds: [], categoriaIds: [5] })],
            VIERNES_23,
        )
        expect(r.lineas[0]).toMatchObject({ varianteId: 100, promocionId: 1, descuento: 4000 })
        expect(r.lineas[1]).toMatchObject({ varianteId: 200, promocionId: 2, descuento: 600 })
        expect(r).toMatchObject({ subTotal: 14000, descuento: 4600, total: 9400 })
        expect(r.total).toBe(r.subTotal - r.descuento)
    })

    it("Una linea sin promo convive con otra que si tiene", () => {
        const r = aplicarPromos([item({ cantidad: 2 }), cerveza()], [promo()], VIERNES_23)
        expect(r.lineas[1]).toMatchObject({ promocionId: null, descuento: 0, subTotal: 3000 })
        expect(r).toMatchObject({ subTotal: 11000, descuento: 4000, total: 7000 })
    })
})
