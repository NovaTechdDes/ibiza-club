import { aplicarPromos, LineaCalculada } from "@ibiza/shared";
import { useCarrito } from "../stores/carrito"
import { usePromos } from "./useCatalogo";

export type LineaVenta = LineaCalculada & {
    nombre: string;
    envaseNombre: string;
}

export const useCarritoCalculado = () => {
  const items = useCarrito((estado) => estado.items);
  const {data: promos} = usePromos();

  const calculado = aplicarPromos(items, promos ?? [], new Date());

  const lineas = calculado.lineas.map((linea): LineaVenta => {
    const item = items.find((i) => i.varianteId === linea.varianteId);
    return {
        ...linea,
        nombre: item?.nombre ?? '',
        envaseNombre: item?.envaseNombre ?? ''
    }
  })

  const cantidad = items.reduce((suma, item) => suma + item.cantidad, 0)

  return {
    ...calculado,
    lineas,
    cantidad
  }
}