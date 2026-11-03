import { Boton, Tarjeta } from "@ibiza/ui";
import { useCarrito } from "../stores/carrito";
import { MEDIOS_PAGO } from "@ibiza/shared";
import { confirmar } from "../lib/alertas";

import estilos from "./PantallaVenta.module.css";
import type { Vinculacion } from "../db/ajustes";
import { useBajada } from "../hooks/useBajada";

interface Props {
  vinculacion: Vinculacion;
}

export function PantallaVenta({ vinculacion }: Props) {
  const { isPending, isError } = useBajada(vinculacion);

  const cantidad = useCarrito((estado) => estado.cantidad);
  const vaciar = useCarrito((estado) => estado.vaciar);
  const agregar = useCarrito((estado) => estado.agregar);

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
      </header>

      <Tarjeta className={estilos.productos}>
        <p>Acá van los productos</p>
        <Boton onClick={agregar} variante="secundario">
          Agregar de prueba
        </Boton>
      </Tarjeta>

      <Tarjeta className={estilos.carrito}>
        <div className={estilos.carritoEncabezado}>
          <strong>Carrito: {cantidad}</strong>
          <Boton
            variante="secundario"
            disabled={cantidad === 0}
            onClick={pedirVaciar}
          >
            Vaciar
          </Boton>
        </div>

        <div className={estilos.items}></div>

        <div className={estilos.pagos}>
          {MEDIOS_PAGO.map((elem) => (
            <Boton disabled={cantidad === 0} key={elem}>
              {elem}
            </Boton>
          ))}
        </div>
      </Tarjeta>
    </div>
  );
}
