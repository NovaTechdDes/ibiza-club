import { Boton } from "@ibiza/ui";
import { LineaVenta } from "../hooks/useCarritoCalculado";
import estilos from "./LineaCarrito.module.css";

interface Props {
  linea: LineaVenta;
  onCambiar: (cambio: number) => void;
}

export const LineaCarrito = ({ linea, onCambiar }: Props) => {
  return (
    <div className={estilos.linea}>
      <div className={estilos.info}>
        <strong>
          {linea.nombre} ({linea.envaseNombre})
        </strong>
        <span>$ {linea.subTotal.toLocaleString("es-AR")}</span>
        {linea.descuento > 0 && (
          <span className={estilos.promo}>
            {linea.promocionNombre}: -${" "}
            {linea.descuento.toLocaleString("es-AR")}
          </span>
        )}
      </div>

      <div className={estilos.controles}>
        <Boton className={estilos.boton} onClick={() => onCambiar(-1)}>
          -
        </Boton>
        <span>{linea.cantidad}</span>
        <Boton className={estilos.boton} onClick={() => onCambiar(1)}>
          +
        </Boton>
      </div>
    </div>
  );
};
