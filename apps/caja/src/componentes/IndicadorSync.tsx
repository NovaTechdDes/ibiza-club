import { type EstadoSync, useEstadoSync } from "../hooks/useEstadoSync";
import { avisaError } from "../lib/alertas";
import estilos from "./IndicadorSync.module.css";

const pendientes = (cantidad: number) =>
  cantidad === 1 ? "1 pendiente" : `${cantidad} pendientes`;

// Texto y color de cada estado. El switch sin default hace que TypeScript
// avise si se agrega un estado nuevo y no se lo muestra acá.
const presentar = (estado: EstadoSync): { texto: string; color: string } => {
  switch (estado.tipo) {
    case "iniciando":
      return { texto: "Sincronizando…", color: estilos.suave };
    case "sincronizado":
      return { texto: "Sincronizado", color: estilos.exito };
    case "pendientes":
      return { texto: pendientes(estado.cantidad), color: estilos.acento };
    case "sin-internet":
      return {
        texto:
          estado.cantidad > 0
            ? `Sin internet · ${pendientes(estado.cantidad)}`
            : "Sin internet",
        color: estilos.peligro,
      };
    case "error":
      return { texto: "Error de sincronización", color: estilos.peligro };
  }
};

export function IndicadorSync() {
  const estado = useEstadoSync();
  const { texto, color } = presentar(estado);

  // En pantalla táctil no hay hover: el detalle del error se ve tocando
  const verDetalle = () => {
    if (estado.tipo === "error") avisaError(estado.mensaje);
  };

  return (
    <button
      type="button"
      className={`${estilos.indicador} ${color}`}
      onClick={verDetalle}
      disabled={estado.tipo !== "error"}
    >
      {texto}
    </button>
  );
}
