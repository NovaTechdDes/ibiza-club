import estilos from "./Tarjeta.module.css";
import type { ComponentProps } from "react";
export function Tarjeta({
  className = "",

  ...resto
}: ComponentProps<"div">) {
  const clases = `${estilos.tarjeta} ${className}`;
  return <div className={clases} {...resto} />;
}
