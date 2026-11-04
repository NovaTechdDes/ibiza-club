import { PedirPin } from "../componentes/PedirPin";
import { useSesion } from "../stores/sesion";
export function PantallaPin() {
  const entrar = useSesion((estado) => estado.entrar);
  return <PedirPin titulo="¿Quién sos?" onCorrecto={entrar} />;
}
