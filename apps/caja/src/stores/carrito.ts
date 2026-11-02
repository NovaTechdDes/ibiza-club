import { create } from "zustand";

type CarritoState = {
    cantidad: number;
    agregar: () => void;
    vaciar: () => void;
}

export const useCarrito = create<CarritoState>((set) => ({
    cantidad: 0,
    agregar: () => set((estado) => ({cantidad: estado.cantidad + 1})),
    vaciar: () => set({cantidad: 0})
}))