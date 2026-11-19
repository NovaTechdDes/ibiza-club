import { useQuery } from "@tanstack/react-query";
import type { Vinculacion } from "../db/ajustes";
import { buscarActualizacion } from "../lib/actualizacion";

export const CLAVE_ACTUALIZACION = ["actualizacion"];

export const useActualizacion = (vinculacion: Vinculacion) => 
    useQuery({
        queryKey: CLAVE_ACTUALIZACION,
        queryFn: () => buscarActualizacion(vinculacion),
        refetchInterval: 30 * 60_000,
        refetchIntervalInBackground: true,
        retry: false
    })