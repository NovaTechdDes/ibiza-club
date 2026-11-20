import estilos from "./BarraCategorias.module.css";
import type { CategoriaVenta } from "../db/productos";

interface Props {
  categorias: CategoriaVenta[];
  seleccionadaId: number;
  onElegir: (id: number) => void;
}

// Píldoras con contador. La elegida se marca con aria-pressed, y el CSS la pinta
// leyendo ese mismo atributo: no hay una clase aparte que se pueda desincronizar.
export const BarraCategorias = ({
  categorias,
  seleccionadaId,
  onElegir,
}: Props) => {
  return (
    <div className={estilos.barra}>
      {categorias.map((categoria) => (
        <button
          key={categoria.id}
          type="button"
          className={estilos.categoria}
          aria-pressed={categoria.id === seleccionadaId}
          onClick={() => onElegir(categoria.id)}
        >
          {categoria.nombre}
          <span className={estilos.contador}>{categoria.productos.length}</span>
        </button>
      ))}
    </div>
  );
};
