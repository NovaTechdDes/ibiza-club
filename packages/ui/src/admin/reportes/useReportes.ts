import type { RangoReporte } from "@ibiza/shared";
import { useApiAdmin } from "../api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const CLAVE_REPORTES = ["admin", "reportes"] as const;

export type RutaReporte = "/ventas/medio-pago" | "/ventas/caja" | "/ventas/promo" | "/arqueo";

export function useReporte<T>(ruta: RutaReporte, rango: RangoReporte){
    const { api } = useApiAdmin();

    return useQuery({
        queryKey: [...CLAVE_REPORTES, ruta, rango],
        queryFn: async () => (await api.get<T>(`/reportes${ruta}`, { params: rango})).data,
        placeholderData: keepPreviousData,
        staleTime: 60_000
    });
}

export function useEstadoSync<T>(){
    const { api } = useApiAdmin();

    return useQuery({
        queryKey: [...CLAVE_REPORTES, '/sync'],
        queryFn: async () => (await api.get<T>("/reportes/sync")).data,
        refetchInterval: 30_000
    })
}