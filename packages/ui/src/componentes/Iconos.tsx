import type { ReactNode, SVGProps } from "react";

/*
 * Íconos SVG de trazo, todos con la misma grilla de 24x24 y el mismo grosor.
 * Van escritos a mano (no una librería) para que viajen dentro del build:
 * la caja vende sin internet. Toman el color del texto (currentColor).
 */
type IconoProps = SVGProps<SVGSVGElement> & { tamaño?: number };

function Icono({ tamaño = 20, children, ...resto }: IconoProps & { children: ReactNode }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={tamaño}
            height={tamaño}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...resto}
        >
            {children}
        </svg>
    );
}

export function IconoAdministracion(props: IconoProps) {
    return (
        <Icono {...props}>
            <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
            <circle cx="15" cy="6" r="2" />
            <circle cx="9" cy="12" r="2" />
            <circle cx="17" cy="18" r="2" />
        </Icono>
    );
}

export function IconoImpresora(props: IconoProps) {
    return (
        <Icono {...props}>
            <path d="M6 9V3h12v6" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="7" rx="1" />
        </Icono>
    );
}

export function IconoRetiro(props: IconoProps) {
    return (
        <Icono {...props}>
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="2.5" />
            <path d="M6 12h.01M18 12h.01" />
        </Icono>
    );
}

export function IconoAnulacion(props: IconoProps) {
    return (
        <Icono {...props}>
            <path d="M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2Z" />
            <path d="m9.5 8.5 5 5M14.5 8.5l-5 5" />
        </Icono>
    );
}

export function IconoCambiarUsuario(props: IconoProps) {
    return (
        <Icono {...props}>
            <circle cx="9" cy="8" r="4" />
            <path d="M2 21a7 7 0 0 1 11.5-5.4" />
            <path d="m16 13 3-3 3 3M19 10v11" />
        </Icono>
    );
}

export function IconoCandado(props: IconoProps) {
    return (
        <Icono {...props}>
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </Icono>
    );
}
