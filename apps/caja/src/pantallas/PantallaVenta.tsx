import { Boton, Tarjeta } from "@ibiza/ui";
import { useCarrito } from "../stores/carrito";
import { MEDIOS_PAGO, type Rol } from "@ibiza/shared";
import { confirmar } from "../lib/alertas";

import estilos from "./PantallaVenta.module.css";
import { type Vinculacion } from "../db/ajustes";
import { useCategoriaVenta } from "../hooks/useCatalogo";
import { useSesion } from "../stores/sesion";
import { useState } from "react";
import { BarraCategorias } from "../componentes/BarraCategorias";
import { TarjetaProducto } from "../componentes/TarjetaProducto";
import { useCarritoCalculado } from "../hooks/useCarritoCalculado";
import { LineaCarrito } from "../componentes/LineaCarrito";
import { useCobrar } from "../hooks/useCobrar";
import { PedirPin } from "../componentes/PedirPin";
import { PantallaImpresora } from "./PantallaImpresora";
import { PantallaRetiro } from "./PantallaRetiro";
import { IndicadorSync } from "../componentes/IndicadorSync";

// Cambiar la impresora en plena noche puede dejar la caja sin tickets
const ROLES_CONFIGURAN: Rol[] = ["ENCARGADO", "ADMIN"];

interface Props {
  vinculacion: Vinculacion;
}

export function PantallaVenta({ vinculacion }: Props) {
  const usuario = useSesion((estado) => estado.usuario);

  const salir = useSesion((estado) => estado.salir);

  const carrito = useCarritoCalculado();
  const vaciar = useCarrito((estado) => estado.vaciar);
  const agregar = useCarrito((estado) => estado.agregar);
  const cambiarCantidad = useCarrito((estado) => estado.cambiarCantidad);

  const cobrar = useCobrar();

  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [vista, setVista] = useState<
    "venta" | "pin" | "impresora" | "retiro"
  >("venta");

  const { data: categorias } = useCategoriaVenta();

  const categoriaActual =
    categorias?.find((c) => c.id === categoriaId) ?? categorias?.[0];

  async function pedirVaciar() {
    if (await confirmar("¿Vaciar el carrito?", "Vaciar")) vaciar();
  }

  // Estos returns van después de todos los hooks: React exige que se llamen
  // siempre los mismos y en el mismo orden en cada render
  if (vista === "pin") {
    return (
      <PedirPin
        titulo="¿Quién configura la impresora?"
        roles={ROLES_CONFIGURAN}
        onCancelar={() => setVista("venta")}
        onCorrecto={() => setVista("impresora")}
      />
    );
  }

  if (vista === "impresora") {
    return <PantallaImpresora onVolver={() => setVista("venta")} />;
  }

  if (vista === "retiro") {
    return <PantallaRetiro onVolver={() => setVista("venta")} />;
  }

  return (
    <div className={estilos.pantalla}>
      <header className={estilos.encabezado}>
        {cobrar.data && <span>Ultima Venta: #{cobrar.data}</span>}
        <Boton
          variante="secundario"
          disabled={carrito.cantidad > 0}
          onClick={() => setVista("pin")}
        >
          Impresora
        </Boton>
        {/* Con productos en el carrito no se sale de la venta: se perdería la compra en curso */}
        <Boton
          variante="secundario"
          disabled={carrito.cantidad > 0}
          onClick={() => setVista("retiro")}
        >
          Retiro
        </Boton>
        <span>{vinculacion.cajaNombre}</span>
        <IndicadorSync />

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
                  onElegir={(variante) => {
                    // Mientras imprime, el carrito es el de la venta en curso: no se toca
                    if (!cobrar.isPending) agregar(producto, variante);
                  }}
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
            disabled={carrito.cantidad === 0 || cobrar.isPending}
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
              onCambiar={(cambio) => {
                if (!cobrar.isPending)
                  cambiarCantidad(linea.varianteId, cambio);
              }}
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
            <Boton
              disabled={cobrar.isPending || carrito.cantidad === 0}
              key={elem}
              onClick={() => cobrar.mutate(elem)}
            >
              {elem}
            </Boton>
          ))}
        </div>
      </Tarjeta>
    </div>
  );
}
