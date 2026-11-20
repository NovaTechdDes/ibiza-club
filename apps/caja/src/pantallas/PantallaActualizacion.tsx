import { useMutation } from "@tanstack/react-query";
import { Boton } from "@ibiza/ui";
import { instalarActualizacion } from "../lib/actualizacion";
import { Acciones, Dialogo, Mensaje } from "../componentes/Dialogo";
import estilos from "./PantallaActualizacion.module.css";

export function PantallaActualizacion({ version }: { version: string }) {
  const instalar = useMutation({ mutationFn: instalarActualizacion });

  return (
    <Dialogo
      titulo={`Versión ${version}`}
      ayuda="Hay una actualización lista. La caja se cierra unos segundos y se vuelve a abrir sola."
    >
      <Mensaje>
        {instalar.isError && `No se pudo instalar: ${String(instalar.error)}`}
      </Mensaje>

      <Acciones>
        <Boton
          className={estilos.boton}
          disabled={instalar.isPending}
          onClick={() => instalar.mutate()}
        >
          {instalar.isPending ? "Instalando…" : "Instalar y reiniciar"}
        </Boton>
      </Acciones>
    </Dialogo>
  );
}
