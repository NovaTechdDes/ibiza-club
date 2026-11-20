import { IconoMas, IconoMenos } from "@ibiza/ui";
import { LineaVenta } from "../hooks/useCarritoCalculado";
import estilos from "./LineaCarrito.module.css";

interface Props {
  linea: LineaVenta;
  onCambiar: (cambio: number) => void;
}

const pesos = (monto: number) => `$ ${monto.toLocaleString("es-AR")}`;

/*
 * Dos filas: arriba lo que se lee (nombre y subtotal), abajo lo que se toca
 * (envase, precio unitario y los botones de cantidad).
 */
export const LineaCarrito = ({ linea, onCambiar }: Props) => {
  return (
    <div className={estilos.linea}>
      <div className={estilos.fila}>
        <strong className={estilos.nombre}>{linea.nombre}</strong>
        <span className={estilos.subtotal}>{pesos(linea.subTotal)}</span>
      </div>

      <div className={estilos.fila}>
        <span className={estilos.detalle}>
          <span className={estilos.envase}>{linea.envaseNombre}</span>
          {pesos(linea.precio)} c/u
        </span>

        {/* Un solo control tipo "píldora": − cantidad + */}
        <div className={estilos.cantidadControl}>
          <button
            type="button"
            className={estilos.paso}
            aria-label="Quitar uno"
            onClick={() => onCambiar(-1)}
          >
            <IconoMenos tamaño={18} />
          </button>
          <span className={estilos.cantidad}>{linea.cantidad}</span>
          <button
            type="button"
            className={estilos.paso}
            aria-label="Agregar uno"
            onClick={() => onCambiar(1)}
          >
            <IconoMas tamaño={18} />
          </button>
        </div>
      </div>

      {linea.descuento > 0 && (
        <span className={estilos.promo}>
          {linea.promocionNombre}
          <span>-{pesos(linea.descuento)}</span>
        </span>
      )}
    </div>
  );
};
