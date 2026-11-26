import { EstadoPagoQr, OrdenQr } from "@ibiza/shared";
import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { cancelarOrdenQr, consultarOrdenQr, crearOrdenQr } from "../lib/api";
import { Vinculacion } from "../db/ajustes";

const CADA = 2_000;

export type PasoQr = | { paso: "creando" }
  | { paso: "sinQr" } // no se pudo crear la orden (sin internet, MP caído)
  | { paso: "esperando"; orden: OrdenQr; sinConexion: boolean }
  | { paso: "pagado" }
  | { paso: "terminado"; motivo: "VENCIDO" | "CANCELADO" }; 


type Opciones = {
  vinculacion: Vinculacion;
  total: number;
  // MP confirmó el pago: se registra la venta con este id como referencia
  onPagado: (ordenId: string) => void;
  // Se canceló y el cliente no había pagado: vuelve al carrito
  onCancelado: () => void;
};

export const usePagoQr = ({ vinculacion, total, onPagado, onCancelado }: Opciones) => {
  const { apiUrl, token } = vinculacion;

  // Una clave por QR. Reintentar con la misma devuelve la misma orden (idempotencia en MP),
  // así un reintento nunca deja dos QR vivos. Solo cambia al pedir uno nuevo porque venció.
  const [clave, setClave] = useState(() => crypto.randomUUID());

  const orden = useQuery({
    queryKey: ["pagoQr", "orden", clave],
    queryFn: () => crearOrdenQr(apiUrl, token, total, clave),
    staleTime: Infinity, // una vez creada no se vuelve a pedir sola
    gcTime: 0,           // al salir de la pantalla se olvida
    retry: false,        // el reintento lo decide el cajero
  });
  const ordenId = orden.data?.ordenId;

  const estado = useQuery({
    queryKey: ["pagoQr", "estado", ordenId],
    queryFn: ordenId ? () => consultarOrdenQr(apiUrl, token, ordenId) : skipToken,
    gcTime: 0,
    retry: false,
    // Pregunta mientras esté pendiente. Un error de red no corta el sondeo:
    // data se queda en el último estado y el intervalo sigue.
    refetchInterval: (q) => ((q.state.data ?? "PENDIENTE") === "PENDIENTE" ? CADA : false),
    refetchIntervalInBackground: true,
  });

  // onPagado se avisa UNA sola vez: el padre arma una función nueva en cada render,
  // y sin esta marca el efecto registraría la venta dos veces
  const avisado = useRef(false);
  const avisarPagado = (id: string) => {
    if (avisado.current) return;
    avisado.current = true;
    onPagado(id);
  };

  useEffect(() => {
    if (estado.data === "PAGADO" && ordenId) avisarPagado(ordenId);
  });

  const cancelar = useMutation({
    mutationFn: async (): Promise<EstadoPagoQr> =>
      ordenId ? cancelarOrdenQr(apiUrl, token, ordenId) : "CANCELADO",
    // Si el cliente pagó justo al cancelar, la API devuelve PAGADO: la venta se registra igual
    onSuccess: (final) => {
      if (final === "PAGADO" && ordenId) avisarPagado(ordenId);
      else onCancelado();
    },
  });

  const paso: PasoQr =
    orden.isFetching && !orden.data ? { paso: "creando" }
    : orden.isError ? { paso: "sinQr" }
    : !orden.data ? { paso: "creando" }
    : estado.data === "PAGADO" ? { paso: "pagado" }
    : estado.data === "VENCIDO" || estado.data === "CANCELADO" ? { paso: "terminado", motivo: estado.data }
    : { paso: "esperando", orden: orden.data, sinConexion: estado.isError };

  return {
    paso,
    reintentar: () => orden.refetch(),
    generarOtro: () => setClave(crypto.randomUUID()),
    cancelar: () => cancelar.mutate(),
    cancelando: cancelar.isPending,
    errorAlCancelar: cancelar.isError,
  };
};