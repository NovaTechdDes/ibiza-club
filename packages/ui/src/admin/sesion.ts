import type { Rol } from "@ibiza/shared";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Lo que devuelven POST /auth/login y GET /auth/yo.
export type UsuarioPanel = {
    id: number;
    nombre: string;
    rol: Rol;
    email: string;
};

type SesionAdminState = {
    token: string | null;
    usuario: UsuarioPanel | null;
    entrar: (token: string, usuario: UsuarioPanel) => void;
    actualizarUsuario: (usuario: UsuarioPanel) => void;
    salir: () => void;
};

// sessionStorage y no localStorage: la sesión aguanta un F5 pero muere al cerrar
// la pestaña o la app. Es una PC compartida detrás de una barra.
export const useSesionAdmin = create<SesionAdminState>()(
    persist(
        (set) => ({
            token: null,
            usuario: null,
            entrar: (token, usuario) => set({ token, usuario }),
            actualizarUsuario: (usuario) => set({ usuario }),
            salir: () => set({ token: null, usuario: null })
        }),
        {
            name: "ibiza-admin-sesion",
            storage: createJSONStorage(() => sessionStorage),
            partialize: ({ token, usuario }) => ({ token, usuario })
        }
    )
);
