import { useTema } from "../tema";
import estilos from "./BotonTema.module.css";

type Props = {
    // Con texto al lado del ícono (menú de administración). Sin texto queda cuadrado (encabezado de la venta).
    conTexto?: boolean;
    className?: string;
};

// Cambia entre tema claro y oscuro. Muestra a qué tema se pasa al tocarlo.
export function BotonTema({ conTexto = false, className = "" }: Props) {
    const tema = useTema((estado) => estado.tema);
    const alternar = useTema((estado) => estado.alternar);
    const destino = tema === "claro" ? "Modo oscuro" : "Modo claro";

    return (
        <button
            type="button"
            className={`${estilos.boton} ${conTexto ? estilos.conTexto : ""} ${className}`}
            onClick={alternar}
            aria-label={`Cambiar a ${destino.toLowerCase()}`}
        >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {tema === "claro" ? (
                    <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
                ) : (
                    <>
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                    </>
                )}
            </svg>
            {conTexto && <span>{destino}</span>}
        </button>
    );
}
