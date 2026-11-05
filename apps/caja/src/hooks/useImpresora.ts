import { useQuery } from "@tanstack/react-query"
import { leerImpresora } from "../db/ajustes"

export const CLAVE_IMPRESORA = ['impresora']

export const useImpresora = () => 
    useQuery({
        queryKey: CLAVE_IMPRESORA,
        queryFn: leerImpresora,
        staleTime: Infinity
    })