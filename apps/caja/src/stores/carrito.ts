import { ItemCarrito } from "@ibiza/shared";
import { create } from "zustand";
import { ProductoVenta, VarianteVenta } from "../db/productos";

// Lo que necesita el calculo de promos, mas lo que hay mostrar
export type ItemVenta = ItemCarrito & {
    nombre: string;
    envaseNombre: string;
};

type CarritoState = {
    items: ItemVenta[];
    agregar: (producto: ProductoVenta, variante: VarianteVenta) => void;
    cambiarCantidad: (varianteId: number, cambio: number) => void;
    vaciar: () => void;
    quitados: ItemQuitado[];
}
export type ItemQuitado = {
    varianteId: number;
    nombre: string;
    envaseNombre: string;
    precio: number;
    cantidad: number;
};


export const useCarrito = create<CarritoState>((set) => ({
    items: [],
    quitados: [],
    agregar: (producto, variante) =>
        set((estado) => {
            const yaEsta = estado.items.some((i) => i.varianteId === variante.id);
            if(yaEsta){
                return {
                    items: estado.items.map((i) => 
                    i.varianteId === variante.id ? {...i, cantidad: i.cantidad + 1} : i)
                }
            }
            return {
                items: [
                    ...estado.items,
                    {
                        varianteId: variante.id,
                        productoId: producto.id,
                        categoriaId: producto.categoriaId,
                        envaseId: variante.envaseId,
                        precio: variante.precio,
                        cantidad: 1,
                        nombre: producto.nombre,
                        envaseNombre: variante.envaseNombre
                    }
                ]
            }
        }),
    cambiarCantidad: (varianteId, cambio) =>
        set((estado) => {
            const items = estado.items.map((i) => i.varianteId === varianteId ? {...i, cantidad: i.cantidad + cambio} : i)
            .filter((i) => i.cantidad > 0);

            if(cambio >= 0) return {items};

            const item = estado.items.find((i) => i.varianteId === varianteId);
            if(!item) return {items};

            const cantidad = Math.min(-cambio, item.cantidad);
            const yaQuitado = estado.quitados.some((q) => q.varianteId === varianteId);

            const quitados = yaQuitado 
            ? estado.quitados.map((q) => q.varianteId === varianteId ? {...q, cantidad: q.cantidad + cantidad} : q)
            : [
                ...estado.quitados,
                {
                    varianteId: item.varianteId,
                    nombre: item.nombre,
                    envaseNombre: item.envaseNombre,
                    precio: item.precio,
                    cantidad
                }
            ];

            return { items, quitados}
        }),
    vaciar: () => set({ items: [], quitados: []})
}))

