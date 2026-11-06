import { type QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Vinculacion } from "../db/ajustes";
import { useRef } from "react";
import { subirPendientes } from "../sync/subida";
import { CLAVE_PENDIENTES } from "./usePendientes";

export const CLAVE_SUBIDA = ["subida"];

const ESPERA_BASE = 15_000
const ESPERA_MAXIMA = 120_000

const esperaSegunFallos = (fallos: number) => 
    Math.min(ESPERA_BASE * 2 ** fallos, ESPERA_MAXIMA);

export const avisarOperacionNueva = (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: CLAVE_PENDIENTES})
    queryClient.invalidateQueries({queryKey: CLAVE_SUBIDA}, {cancelRefetch: false})
}

export const useSubida = (vinculacion: Vinculacion) => {
    const queryClient = useQueryClient();
    const fallos = useRef(0);

    return useQuery({
        queryKey: CLAVE_SUBIDA,
        queryFn: async () => {
            try {
                const resultado = await subirPendientes(vinculacion);
                fallos.current = resultado.rechazada ? fallos.current + 1 : 0;
                return resultado;
            } catch (error) {
                fallos.current += 1;
                throw error;
            }finally {
                queryClient.invalidateQueries({ queryKey: CLAVE_PENDIENTES});
            }
        },
        refetchInterval: () => esperaSegunFallos(fallos.current),
        refetchIntervalInBackground: true,
        retry: false,
        networkMode: 'always'
    })
    }

    