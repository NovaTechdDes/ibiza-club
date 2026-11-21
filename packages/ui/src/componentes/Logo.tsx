import { useTema } from "../tema";
import logoClaro from "../assets/logo-tema-claro.png";
import logoOscuro from "../assets/logo-tema-oscuro.png";
import triangulo from "../assets/logo-triangulo.png";
import estilos from "./Logo.module.css";

type LogoProps = {
    // completo: triángulo + "IBIZA CLUB" (pantallas de entrada) · triangulo: solo el ícono (encabezado)
    variante?: "completo" | "triangulo";
    className?: string;
};

export function Logo({ variante = "completo", className = "" }: LogoProps) {
    const tema = useTema((estado) => estado.tema);

    // El triángulo es igual en los dos temas; el texto cambia de color.
    const src = variante === "triangulo" ? triangulo : tema === "oscuro" ? logoOscuro : logoClaro;

    return (
        <img
            src={src}
            alt="Ibiza Club"
            className={`${estilos.logo} ${estilos[variante]} ${className}`}
            draggable={false}
        />
    );
}
