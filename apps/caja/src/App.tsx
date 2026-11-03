import { Vinculacion } from "./db/ajustes";
import { useBajada } from "./hooks/useBajada";
import { useVinculacion } from "./hooks/useVinculacion";
import { PantallaPin } from "./pantallas/PantallaPin";
import { PantallaVenta } from "./pantallas/PantallaVenta";
import { PantallaVincular } from "./pantallas/PantallaVincular";
import { useSesion } from "./stores/sesion";

function CajaVinculada({ vinculacion }: { vinculacion: Vinculacion }) {
  useBajada(vinculacion);
  const usuario = useSesion((estado) => estado.usuario);

  if (!usuario) return <PantallaPin />;
  return <PantallaVenta vinculacion={vinculacion} />;
}

export default function App() {
  const { data: vinculacion, isPending, isError } = useVinculacion();

  if (isPending) return null;

  // Sin esto, un error de la base mandaría a vincular una PC que ya está vinculada
  if (isError)
    return <p>No se pudo abrir la base local. Reiniciá la aplicación.</p>;
  if (!vinculacion) return <PantallaVincular />;

  return <CajaVinculada vinculacion={vinculacion} />;
}
