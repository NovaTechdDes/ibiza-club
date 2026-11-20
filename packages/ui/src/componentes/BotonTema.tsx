import { useTema } from "../tema";
import { IconoLuna, IconoSol } from "./Iconos";
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
            {tema === "claro" ? <IconoLuna tamaño={22} /> : <IconoSol tamaño={22} />}
            {conTexto && <span>{destino}</span>}
        </button>
    );
}
