import type { MedioPago } from "@ibiza/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { leerConfigCaja } from "../db/ajustes";
import type { Apertura, Jornada } from "../db/apertura";
import { registrarVenta } from "../db/ventas";
import { avisaError } from "../lib/alertas";
import { imprimirConReintento, imprimirEntradas, imprimirTicket } from "../lib/impresora";
import { calcularJornada } from "../lib/jornada";
import { avisarEntradaVendida, avisarVentaBarra } from "../lib/pantallaCliente";
import { armarTicket } from "../lib/ticket";
import { useCarrito } from "../stores/carrito";
import { useSesion } from "../stores/sesion";
import { useApertura } from "./useApertura";
import { useCarritoCalculado } from "./useCarritoCalculado";
import { useImpresora } from "./useImpresora";
import { useVinculacion } from "./useVinculacion";
import { avisarOperacionNueva } from "./useSubida";
import { useTipoCaja } from "./useCatalogo";

// Con jornada, la letra y la fecha quedaron fijas al abrir la caja.
// Sin jornada, salen de la hora de la venta, sin ningún paso manual.
const jornadaDelTicket = async (
  apertura: Apertura,
  instante: Date,
): Promise<Jornada> => {
  if (apertura.jornadaFecha && apertura.jornadaLetra) {
    return { fecha: apertura.jornadaFecha, letra: apertura.jornadaLetra };
  }
  const config = await leerConfigCaja();
  if (!config) throw new Error("Falta la primera sincronización con la nube");
  return calcularJornada(instante, config.claveLetra);
};

export const useCobrar = () => {
  const queryClient = useQueryClient();
  const { data: apertura } = useApertura();
  const { data: vinculacion } = useVinculacion();
  const { data: impresora } = useImpresora();
  const { data: tipo } = useTipoCaja();
  const usuario = useSesion((estado) => estado.usuario);
  const venta = useCarritoCalculado();
  const vaciar = useCarrito((estado) => estado.vaciar);
  const quitados = useCarrito((estado) => estado.quitados);

  return useMutation({
    mutationFn: async (medioPago: MedioPago) => {
      if (!apertura || !usuario || !vinculacion) {
        throw new Error("Falta la apertura, el cajero o la vinculación");
      }

      // 1. Lo que puede fallar va ANTES de guardar: si falla, no queda nada registrado
      const instante = new Date();
      const jornada = await jornadaDelTicket(apertura, instante);

      // 2. Se guarda la venta. Desde acá ya está cobrada: lo que sigue no puede tirar error,
      //    porque onError diría "no se registró" y el cajero cobraría dos veces
      const numero = await registrarVenta({
        ...venta,
        medioPago,
        aperturaId: apertura.id,
        cajeroId: usuario.id,
        quitados
      });

      // 3. Aviso a la pantalla del cliente y ticket. El aviso va antes de imprimir:
      //    el cliente ve el "Gracias" al pagar, aunque la impresora tarde o falle.
      //    Si la impresora falla pregunta si reintentar, pero nunca tira error
      const esEntrada = tipo === "ENTRADA";
      if (esEntrada) {
        avisarEntradaVendida();
      }else{
        avisarVentaBarra(venta.lineas, venta.total);
      }
      const ticket = armarTicket({
        jornada,
        caja: vinculacion.cajaNombre,
        numero,
        lineas: venta.lineas,
        total: venta.total,
        medioPago,
        instante,
        conEnvase: !esEntrada,
      });
      const imprimir = esEntrada ? imprimirEntradas : imprimirTicket;
      await imprimirConReintento(impresora ?? null, {
        titulo: esEntrada
          ? `No se imprimieron las entradas de la venta #${numero}`
          : `No se imprimió el ticket #${numero}`,
        aclaracion: "La venta ya quedó guardada.",
        imprimir: (c) => imprimir(c.ip, c.puerto, c.ancho, ticket),
      });

      return numero;
    },
    // Se vacía recién al final: mientras imprime, el carrito sigue a la vista
    onSuccess: () => {
      vaciar()
      avisarOperacionNueva(queryClient)
    },
    onError: () => avisaError("No se pudo registrar la venta"),
  });
};
