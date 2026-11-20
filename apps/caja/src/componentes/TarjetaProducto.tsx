import { useState } from "react";
import { Tarjeta } from "@ibiza/ui";
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
      {/* La foto siempre ocupa su lugar: sin imagen va la inicial, así todas las tarjetas miden lo mismo */}
      <div className={estilos.foto}>
        {imagen ? (
          <img
            className={estilos.imagen}
            src={imagen}
            onError={() => setFalloEn(imagen)}
            alt=""
            draggable={false}
          />
        ) : (
          <span className={estilos.inicial} aria-hidden="true">
            {producto.nombre.charAt(0)}
          </span>
        )}
      </div>

      <strong className={estilos.nombre}>{producto.nombre}</strong>

      {/* button propio y no Boton: es un selector de dos renglones (envase y precio) con su propio estilo */}
      <div className={estilos.variantes}>
        {producto.variantes.map((variante) => (
          <button
            key={variante.id}
            type="button"
            className={estilos.variante}
            onClick={() => onElegir(variante)}
          >
            <span className={estilos.envase}>{variante.envaseNombre}</span>
            <span className={estilos.precio}>
              <span className={estilos.moneda}>$</span>
              {variante.precio.toLocaleString("es-AR")}
            </span>
          </button>
        ))}
      </div>
    </Tarjeta>
  );
}
