import { Boton, Tarjeta } from "@ibiza/ui";
import type { ProductoVenta, VarianteVenta } from "../db/productos";
import estilos from "./TarjetaProducto.module.css";
interface Props {
  producto: ProductoVenta;
  onElegir: (variante: VarianteVenta) => void;
}

export function TarjetaProducto({ producto, onElegir }: Props) {
  return (
    <Tarjeta className={estilos.tarjeta}>
      <strong className={estilos.nombre}>{producto.nombre}</strong>

      <div className={estilos.variantes}>
        {producto.variantes.map((variante) => (
          <Boton
            key={variante.id}
            variante="secundario"
            className={estilos.variante}
            onClick={() => onElegir(variante)}
          >
            <span>{variante.envaseNombre}</span>
            <span className={estilos.precio}>
              $ {variante.precio.toLocaleString("es-AR")}
            </span>
          </Boton>
        ))}
      </div>
    </Tarjeta>
  );
}
