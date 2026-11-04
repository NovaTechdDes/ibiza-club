import { Boton, Tarjeta } from "@ibiza/ui";
import { useCarrito } from "../stores/carrito";
import { MEDIOS_PAGO } from "@ibiza/shared";
import { confirmar } from "../lib/alertas";

import estilos from "./PantallaVenta.module.css";
import { type Vinculacion } from "../db/ajustes";
import { useBajada } from "../hooks/useBajada";
import { useCategoriaVenta, usePromos } from "../hooks/useCatalogo";
import { useSesion } from "../stores/sesion";

interface Props {
  vinculacion: Vinculacion;
}

export function PantallaVenta({ vinculacion }: Props) {
  const { isPending, isError } = useBajada(vinculacion);
  const usuario = useSesion((estado) => estado.usuario);
  const salir = useSesion((estado) => estado.salir);

  const cantidad = useCarrito((estado) => estado.cantidad);
  const vaciar = useCarrito((estado) => estado.vaciar);
  const agregar = useCarrito((estado) => estado.agregar);

  // Temporal (F8.a): para probar la lectura del catálogo
  const { data: categorias } = useCategoriaVenta();
  const { data: promos } = usePromos();
  console.log({ categorias, promos });

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
          <Boton variante="secundario" disabled={cantidad > 0} onClick={salir}>
            Salir
          </Boton>
        </div>
      </header>

      <Tarjeta className={estilos.productos}>
        <p>
          {categorias?.length ?? 0} categorías · {promos?.length ?? 0} promos
        </p>
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
