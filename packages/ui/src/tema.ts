import { create } from "zustand";

export type Tema = "claro" | "oscuro";

const CLAVE = "ibiza.tema";

// El claro es el tema principal: solo se usa el oscuro si alguien lo eligió en esta PC.
function leerGuardado(): Tema {
    try {
        return localStorage.getItem(CLAVE) === "oscuro" ? "oscuro" : "claro";
    } catch {
        return "claro";
    }
}

// tema.css define el oscuro bajo :root[data-tema="oscuro"].
function aplicar(tema: Tema) {
    document.documentElement.dataset.tema = tema;
}

type EstadoTema = {
    tema: Tema;
    alternar: () => void;
};

export const useTema = create<EstadoTema>((set, get) => ({
    tema: leerGuardado(),
    alternar: () => {
        const tema: Tema = get().tema === "claro" ? "oscuro" : "claro";
        aplicar(tema);
        try {
            localStorage.setItem(CLAVE, tema);
        } catch {
            // Sin almacenamiento el tema igual cambia; solo no se recuerda al reabrir.
        }
        set({ tema });
    }
}));

// Al importar el paquete, antes del primer render: así no se ve un parpadeo del otro tema.
aplicar(useTema.getState().tema);
