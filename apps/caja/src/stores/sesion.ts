
import { create } from "zustand";
import { Usuario } from "../db/usuario";
import { registrarAuditoria } from "../db/auditoria";
import { descartarCarrito } from "../lib/descartes";

type SesionState = {
    usuario: Usuario | null;
    entrar: (usuario: Usuario) => void;
    salir: () => void;
};

export const useSesion = create<SesionState>((set, get) => ({
    usuario: null,
    entrar: (usuario: Usuario) => {
        set({usuario: usuario});
        registrarAuditoria({accion: 'INGRESO', usuarioId: usuario.id}).catch(console.error);
    },
    salir: () => {
        const actual = get().usuario;
        set({ usuario: null});
        if(actual) {
            descartarCarrito(actual.id);
            registrarAuditoria({ accion: "SALIDA", usuarioId: actual.id}).catch(console.error);
        }
    }

}))