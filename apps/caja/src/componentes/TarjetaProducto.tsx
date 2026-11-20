import { useState } from "react";
import { Boton, Tarjeta } from "@ibiza/ui";
import type { ProductoVenta, VarianteVenta } from "../db/productos";
import estilos from "./TarjetaProducto.module.css";
interface Props {
  producto: ProductoVenta;
  onElegir: (variante: VarianteVenta) => void;
}

export function TarjetaProducto({ producto, onElegir }: Props) {
  const [falloEn, setFalloEn] = useState<string | null>(null);
  // Si la dirección que llega es la que ya falló, no se muestra; si cambió, se reintenta
  const imagen = producto.imagen !== falloEn ? producto.imagen : null;

  return (
    <Tarjeta className={estilos.tarjeta}>
      <div className={estilos.encabezado}>
        {imagen && (
          <img
            className={estilos.imagen}
            src={imagen}
            onError={() => setFalloEn(imagen)}
            alt=""
            draggable={false}
          />
        )}
        <strong className={estilos.nombre}>{producto.nombre}</strong>
      </div>

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
              <span className={estilos.moneda}>$</span>
              {variante.precio.toLocaleString("es-AR")}
            </span>
          </Boton>
        ))}
      </div>
    </Tarjeta>
  );
}
