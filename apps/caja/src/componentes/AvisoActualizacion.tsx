import { skipToken, useQuery } from "@tanstack/react-query";
import { CLAVE_ACTUALIZACION } from "../hooks/useActualizacion";
import estilos from "./AvisoActualizacion.module.css";

export function AvisoActualizacion() {
  const { data: version } = useQuery<string | null>({
    queryKey: CLAVE_ACTUALIZACION,
    queryFn: skipToken,
  });

  if (!version) return null;

  return (
    <span className={estilos.aviso}>
      Versión {version} lista · se instala al cerrar la caja
    </span>
  );
}
