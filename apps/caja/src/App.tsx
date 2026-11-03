import { useVinculacion } from "./hooks/useVinculacion";
import { PantallaVenta } from "./pantallas/PantallaVenta";
import { PantallaVincular } from "./pantallas/PantallaVincular";

export default function App() {
  const { data: vinculacion, isPending, isError } = useVinculacion();

  if (isPending) return null;

  // Sin esto, un error de la base mandaría a vincular una PC que ya está vinculada
  if (isError)
    return <p>No se pudo abrir la base local. Reiniciá la aplicación.</p>;
  if (!vinculacion) return <PantallaVincular />;

  return <PantallaVenta vinculacion={vinculacion} />;
}
