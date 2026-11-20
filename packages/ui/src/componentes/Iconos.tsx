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

// Mismo dibujo (un billete): retirar efectivo y cobrar en efectivo
export const IconoEfectivo = IconoRetiro;

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

export function IconoTransferencia(props: IconoProps) {
    return (
        <Icono {...props}>
            <path d="M3 8h15M14 4l4 4-4 4" />
            <path d="M21 16H6M10 12l-4 4 4 4" />
        </Icono>
    );
}

export function IconoTarjeta(props: IconoProps) {
    return (
        <Icono {...props}>
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20M6 15h4" />
        </Icono>
    );
}

export function IconoPapelera(props: IconoProps) {
    return (
        <Icono {...props}>
            <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
            <path d="M10 11v6M14 11v6" />
        </Icono>
    );
}

export function IconoCarrito(props: IconoProps) {
    return (
        <Icono {...props}>
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
            <path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6" />
        </Icono>
    );
}

export function IconoMas(props: IconoProps) {
    return (
        <Icono {...props}>
            <path d="M12 5v14M5 12h14" />
        </Icono>
    );
}

export function IconoMenos(props: IconoProps) {
    return (
        <Icono {...props}>
            <path d="M5 12h14" />
        </Icono>
    );
}

// Tecla de retroceso: borra el último dígito en el teclado numérico
export function IconoBorrar(props: IconoProps) {
    return (
        <Icono {...props}>
            <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z" />
            <path d="m12 9 5 5M17 9l-5 5" />
        </Icono>
    );
}

export function IconoSol(props: IconoProps) {
    return (
        <Icono {...props}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </Icono>
    );
}

export function IconoLuna(props: IconoProps) {
    return (
        <Icono {...props}>
            <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
        </Icono>
    );
}

/* ---- Secciones de la administración ---- */

export function IconoCatalogo(props: IconoProps) {
    return (
        <Icono {...props}>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </Icono>
    );
}

export function IconoPromo(props: IconoProps) {
    return (
        <Icono {...props}>
            <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9Z" />
            <circle cx="7.5" cy="7.5" r="1.5" />
        </Icono>
    );
}

export function IconoReportes(props: IconoProps) {
    return (
        <Icono {...props}>
            <path d="M3 3v18h18" />
            <path d="M8 17v-5M13 17V8M18 17v-8" />
        </Icono>
    );
}

export function IconoUsuarios(props: IconoProps) {
    return (
        <Icono {...props}>
            <circle cx="9" cy="8" r="4" />
            <path d="M2 21a7 7 0 0 1 14 0" />
            <path d="M16 3.5a4 4 0 0 1 0 9M22 21a7 7 0 0 0-4-6.3" />
        </Icono>
    );
}

export function IconoCaja(props: IconoProps) {
    return (
        <Icono {...props}>
            <rect x="2" y="3" width="20" height="13" rx="2" />
            <path d="M8 21h8M12 16v5" />
        </Icono>
    );
}

export function IconoSalir(props: IconoProps) {
    return (
        <Icono {...props}>
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <path d="M10 17l-5-5 5-5M5 12h11" />
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
