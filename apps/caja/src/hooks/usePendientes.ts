import { useQuery } from "@tanstack/react-query"
import { contarPendientes } from "../db/cola"

export const CLAVE_PENDIENTES = ['pendientes']

export const usePendientes = () => 
     useQuery({
        queryKey: CLAVE_PENDIENTES,
        queryFn: contarPendientes,
        staleTime: Infinity
    })