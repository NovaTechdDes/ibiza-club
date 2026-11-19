import { useMutation } from "@tanstack/react-query";
import estilos from "./PantallaActualizacion.module.css";
import { instalarActualizacion } from "../lib/actualizacion";
import { Boton, Tarjeta } from "@ibiza/ui";

export function PantallaActualizacion({ version }: { version: string }) {
  const instalar = useMutation({ mutationFn: instalarActualizacion });

  return (
    <div className={estilos.pantalla}>
      <Tarjeta className={estilos.tarjeta}>
        <h1 className={estilos.titulo}>Versión {version}</h1>
        <p className={estilos.texto}>
          Hay una actualización lista. La caja se cierra unos segundos y se
          vuelve a abrir sola.
        </p>

        <p className={estilos.error}>
          {instalar.isError && `No se pudo instalar: ${String(instalar.error)}`}
        </p>

        <Boton
          className={estilos.boton}
          disabled={instalar.isPending}
          onClick={() => instalar.mutate()}
        >
          {instalar.isPending ? "Instalando…" : "Instalar y reiniciar"}
        </Boton>
      </Tarjeta>
    </div>
  );
}
