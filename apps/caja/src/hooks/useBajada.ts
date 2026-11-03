import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bajarCatalogo } from "../sync/bajada";
import  type { Vinculacion } from "../db/ajustes";
import { CLAVE_VINCULACION } from "./useVinculacion";

export const CLAVE_BAJADA = ["bajada"];

export const useBajada = (vinculacion: Vinculacion) => {
    const queryClient = useQueryClient();
    
    return useQuery({
        queryKey: CLAVE_BAJADA,
        queryFn: async() => {
            const resultado = await bajarCatalogo(vinculacion)

            queryClient.setQueryData(CLAVE_VINCULACION, {...vinculacion, cajaNombre: resultado.cajaNombre})

            return resultado;
        },
        refetchInterval: 60_000,
        refetchIntervalInBackground: true,
        retry: false
    })
}