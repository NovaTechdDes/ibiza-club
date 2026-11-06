import { skipToken, useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { ResultadoSubida } from "../sync/subida";
import { CLAVE_BAJADA } from "./useBajada";
import { usePendientes } from "./usePendientes";
import { CLAVE_SUBIDA } from "./useSubida";

export type EstadoSync =
  | { tipo: "iniciando" }
  | { tipo: "sincronizado" }
  | { tipo: "pendientes"; cantidad: number }
  | { tipo: "sin-internet"; cantidad: number }
  | { tipo: "error"; cantidad: number; mensaje: string };

// Solo LEE lo que dejaron useSubida y useBajada en la caché.
// Con skipToken este observador nunca pide nada ni suma otro intervalo.
const useLeerConsulta = <T>(queryKey: string[]) =>
  useQuery<T>({ queryKey, queryFn: skipToken });

// Sin respuesta = no llegó al servidor (sin internet, API caída, DNS...)
const esSinInternet = (error: Error) =>
  axios.isAxiosError(error) && !error.response;

const describirError = (error: Error) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    return "La nube no reconoce esta caja. Hay que volver a vincularla.";
  }
  return "Error al sincronizar con la nube.";
};

export const useEstadoSync = (): EstadoSync => {
  const subida = useLeerConsulta<ResultadoSubida>(CLAVE_SUBIDA);
  const bajada = useLeerConsulta<unknown>(CLAVE_BAJADA);
  const { data: cantidad = 0 } = usePendientes();

  // Mientras reintenta, TanStack conserva el último error: el cartel no parpadea
  const error = subida.error ?? bajada.error;
  if (error) {
    return esSinInternet(error)
      ? { tipo: "sin-internet", cantidad }
      : { tipo: "error", cantidad, mensaje: describirError(error) };
  }

  // Una rechazada llega con 200: no es un error de TanStack, viene en data
  const rechazada = subida.data?.rechazada;
  if (rechazada) {
    return {
      tipo: "error",
      cantidad,
      mensaje: `La nube rechazó ${rechazada.tipo} #${rechazada.idLocal}: ${rechazada.motivo}`,
    };
  }

  if (subida.isPending) return { tipo: "iniciando" };
  if (cantidad > 0) return { tipo: "pendientes", cantidad };
  return { tipo: "sincronizado" };
};
