import { type SelectHTMLAttributes } from "react";
import estilos from "./CampoTexto.module.css";

// `grupo` es opcional: si alguna opción lo trae, las opciones se muestran en <optgroup>.
export type OpcionSelect = { valor: string; texto: string; grupo?: string };

type CampoSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  etiqueta: string;
  opciones: readonly OpcionSelect[];
  placeholder?: string;
};

// Junta las opciones por grupo. Los grupos salen en el orden en que aparecen por primera vez,
// así el orden lo decide quien arma las opciones. Una opción sin grupo va a un grupo "" (sin título).
function agrupar(opciones: readonly OpcionSelect[]) {
  const grupos = new Map<string, OpcionSelect[]>();
  for (const opcion of opciones) {
    const clave = opcion.grupo ?? "";
    const lista = grupos.get(clave);
    if (lista) lista.push(opcion);
    else grupos.set(clave, [opcion]);
  }
  return [...grupos];
}

function Opcion({ opcion }: { opcion: OpcionSelect }) {
  return <option value={opcion.valor}>{opcion.texto}</option>;
}

export function CampoSelect({
  etiqueta,
  opciones,
  placeholder,
  className = "",
  ...resto
}: CampoSelectProps) {
  const conGrupos = opciones.some((opcion) => opcion.grupo !== undefined);

  return (
    <label className={`${estilos.campo} ${className}`}>
      <span className={estilos.etiqueta}>{etiqueta}</span>
      <select className={`${estilos.input} ${estilos.select}`} {...resto}>
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {conGrupos
          ? agrupar(opciones).map(([grupo, lista]) => (
              <optgroup label={grupo} key={grupo}>
                {lista.map((opcion) => (
                  <Opcion opcion={opcion} key={opcion.valor} />
                ))}
              </optgroup>
            ))
          : opciones.map((opcion) => (
              <Opcion opcion={opcion} key={opcion.valor} />
            ))}
      </select>
    </label>
  );
}
