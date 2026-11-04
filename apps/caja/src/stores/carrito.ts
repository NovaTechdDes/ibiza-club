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
}

export const useCarrito = create<CarritoState>((set) => ({
    items: [],
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
        set((estado) => ({
            items: estado.items.map((i) => i.varianteId === varianteId ? {...i, cantidad: i.cantidad + cambio} : i).filter((i) => i.cantidad > 0)
        })),
    vaciar: () => set({ items: []})
}))

