import type { ButtonHTMLAttributes } from "react";
import estilos from "./Boton.module.css";

type Variante = "primario" | "secundario" | "peligro";
type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
};

export function Boton({
  variante = "primario",
  className = "",
  type = "button",
  ...resto
}: BotonProps) {
  const clases = `${estilos.boton} ${estilos[variante]} ${className}`;
  return <button type={type} className={clases} {...resto} />;
}
