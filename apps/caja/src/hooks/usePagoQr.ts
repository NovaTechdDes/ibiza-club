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
  // El cajero vio la transferencia en el celular y el QR ya no se puede pagar
  onManual: () => void;
  // Se canceló y el cliente no había pagado: vuelve al carrito
  onCancelado: () => void;
};

// Para qué se cancela el QR: para volver al carrito o para cobrar a mano
type Destino = "volver" | "manual";

export const usePagoQr = ({ vinculacion, total, onPagado, onManual, onCancelado }: Opciones) => {
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

  // La venta se registra UNA sola vez, sea por QR o a mano: el padre arma funciones nuevas
  // en cada render, y el sondeo puede ver PAGADO justo cuando el cajero confirma a mano
  const avisado = useRef(false);
  const unaVez = (avisar: () => void) => {
    if (avisado.current) return;
    avisado.current = true;
    avisar();
  };
  const avisarPagado = (id: string) => unaVez(() => onPagado(id));
  const avisarManual = () => unaVez(onManual);

  useEffect(() => {
    if (estado.data === "PAGADO" && ordenId) avisarPagado(ordenId);
  });

  const cancelar = useMutation({
    mutationFn: async (_destino: Destino): Promise<EstadoPagoQr> =>
      ordenId ? cancelarOrdenQr(apiUrl, token, ordenId) : "CANCELADO",
    // Si el cliente pagó justo al cancelar, la API devuelve PAGADO: la venta se registra
    // igual, y con la referencia de MP aunque el cajero haya tocado "Confirmar a mano"
    onSuccess: (final, destino) => {
      if (final === "PAGADO" && ordenId) avisarPagado(ordenId);
      else if (destino === "manual") avisarManual();
      else onCancelado();
    },
    // Sin conexión no se puede cancelar. Para volver se avisa y se deja decidir al cajero;
    // a mano se cobra igual: ya vio la plata en el celular
    onError: (_error, destino) => {
      if (destino === "manual") avisarManual();
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
    cancelar: () => cancelar.mutate("volver"),
    // Antes de cobrar a mano se cancela el QR: si no, queda vivo 10 minutos y,
    // si alguien lo paga, entra plata sin venta
    confirmarManual: () => cancelar.mutate("manual"),
    cancelando: cancelar.isPending,
    errorAlCancelar: cancelar.isError && cancelar.variables === "volver",
  };
};