import { Boton } from "@ibiza/ui";
import estilos from "./BarraCategorias.module.css";
import type { CategoriaVenta } from "../db/productos";

interface Props {
  categorias: CategoriaVenta[];
  seleccionadaId: number;
  onElegir: (id: number) => void;
}

export const BarraCategorias = ({
  categorias,
  seleccionadaId,
  onElegir,
}: Props) => {
  return (
    <div className={estilos.barra}>
      {categorias.map((categoria) => (
        <Boton
          key={categoria.id}
          onClick={() => onElegir(categoria.id)}
          variante={categoria.id === seleccionadaId ? "primario" : "secundario"}
        >
          {categoria.nombre}
        </Boton>
      ))}
    </div>
  );
};
