import { useQuery } from "@tanstack/react-query";
import { useApiAdmin } from "../api";
import type { CajaListado } from "@ibiza/shared";

export const CLAVE_CAJAS = ["admin", "cajas"] as const;

export function useCajas() {
  const { api } = useApiAdmin();

  return useQuery({
    queryKey: CLAVE_CAJAS,
    queryFn: async () => (await api.get<CajaListado[]>("/cajas")).data,
  });
}
