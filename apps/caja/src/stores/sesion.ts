
import { create } from "zustand";
import { Usuario } from "../db/usuario";

type SesionState = {
    usuario: Usuario | null;
    entrar: (usuario: Usuario) => void;
    salir: () => void;
};

export const useSesion = create<SesionState>((set) => ({
    usuario: null,
    entrar: (usuario: Usuario) => set(() => ({usuario: usuario})),
    salir: () => set(() => ({usuario: null}))

}))