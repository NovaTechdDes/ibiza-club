import { type SelectHTMLAttributes } from "react";
import estilos from "./CampoTexto.module.css";

export type OpcionSelect = { valor: string; texto: string };

type CampoSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  etiqueta: string;
  opciones: readonly OpcionSelect[];
  placeholder?: string;
};

export function CampoSelect({
  etiqueta,
  opciones,
  placeholder,
  className = "",
  ...resto
}: CampoSelectProps) {
  return (
    <label className={`${estilos.campo} ${className}`}>
      <span className={estilos.etiqueta}>{etiqueta}</span>
      <select className={`${estilos.input} ${estilos.select}`} {...resto}>
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {opciones.map((opcion) => (
          <option value={opcion.valor} key={opcion.valor}>
            {opcion.texto}
          </option>
        ))}
      </select>
    </label>
  );
}
