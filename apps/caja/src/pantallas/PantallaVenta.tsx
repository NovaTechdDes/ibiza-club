import { Boton, Tarjeta } from "@ibiza/ui";
import { useCarrito } from "../stores/carrito";
import { MEDIOS_PAGO } from "@ibiza/shared";
import { confirmar } from "../lib/alertas";

import estilos from "./PantallaVenta.module.css";
import { type Vinculacion } from "../db/ajustes";
import { useBajada } from "../hooks/useBajada";
import { useCategoriaVenta } from "../hooks/useCatalogo";
import { useSesion } from "../stores/sesion";
import { useState } from "react";
import { BarraCategorias } from "../componentes/BarraCategorias";
import { TarjetaProducto } from "../componentes/TarjetaProducto";
import { useCarritoCalculado } from "../hooks/useCarritoCalculado";
import { LineaCarrito } from "../componentes/LineaCarrito";

interface Props {
  vinculacion: Vinculacion;
}

export function PantallaVenta({ vinculacion }: Props) {
  const { isPending, isError } = useBajada(vinculacion);
  const usuario = useSesion((estado) => estado.usuario);
  const salir = useSesion((estado) => estado.salir);

  const carrito = useCarritoCalculado();
  const vaciar = useCarrito((estado) => estado.vaciar);
  const agregar = useCarrito((estado) => estado.agregar);
  const cambiarCantidad = useCarrito((estado) => estado.cambiarCantidad);

  const [categoriaId, setCategoriaId] = useState<number | null>(null);

  const { data: categorias } = useCategoriaVenta();

  const categoriaActual =
    categorias?.find((c) => c.id === categoriaId) ?? categorias?.[0];

  async function pedirVaciar() {
    if (await confirmar("¿Vaciar el carrito?", "Vaciar")) vaciar();
  }

  return (
    <div className={estilos.pantalla}>
      <header className={estilos.encabezado}>
        <span>{vinculacion.cajaNombre}</span>
        <span>
          {isPending
            ? "Sincronizando..."
            : isError
              ? "Sin sincronizar"
              : "Catálogo al día"}
        </span>
        <div className={estilos.sesion}>
          <span>{usuario?.nombre}</span>
          <Boton
            variante="secundario"
            disabled={carrito.cantidad > 0}
            onClick={salir}
          >
            Salir
          </Boton>
        </div>
      </header>

      <Tarjeta className={estilos.productos}>
        {categorias && categoriaActual ? (
          <>
            <BarraCategorias
              categorias={categorias}
              seleccionadaId={categoriaActual.id}
              onElegir={setCategoriaId}
            />
            <div className={estilos.grilla}>
              {categoriaActual.productos.map((producto) => (
                <TarjetaProducto
                  key={producto.id}
                  producto={producto}
                  onElegir={(variante) => agregar(producto, variante)}
                />
              ))}
            </div>
          </>
        ) : (
          <p>Todavía no hay productos. Esperá la sincronización.</p>
        )}
      </Tarjeta>

      <Tarjeta className={estilos.carrito}>
        <div className={estilos.carritoEncabezado}>
          <strong>Carrito: {carrito.cantidad}</strong>
          <Boton
            variante="secundario"
            disabled={carrito.cantidad === 0}
            onClick={pedirVaciar}
          >
            Vaciar
          </Boton>
        </div>

        <div className={estilos.items}>
          {carrito.lineas.map((linea) => (
            <LineaCarrito
              linea={linea}
              key={linea.varianteId}
              onCambiar={(cambio) => cambiarCantidad(linea.varianteId, cambio)}
            />
          ))}
        </div>

        <div className={estilos.resumen}>
          {carrito.descuento > 0 && (
            <div className={estilos.descuento}>
              <span>Descuento</span>
              <span>-$ {carrito.descuento.toLocaleString("es-AR")}</span>
            </div>
          )}
          <div className={estilos.total}>
            <span>TOTAL</span>
            <span>$ {carrito.total.toLocaleString("es-AR")}</span>
          </div>
        </div>

        <div className={estilos.pagos}>
          {MEDIOS_PAGO.map((elem) => (
            <Boton disabled={carrito.cantidad === 0} key={elem}>
              {elem}
            </Boton>
          ))}
        </div>
      </Tarjeta>
    </div>
  );
}
