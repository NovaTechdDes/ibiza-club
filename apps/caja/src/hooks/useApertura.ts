import { useQuery } from "@tanstack/react-query";
import { leerAperturaAbierta } from "../db/apertura";

export const CLAVE_APERTURA = ['apertura'];

export const useApertura = () => 
    useQuery({
        queryKey: CLAVE_APERTURA,
        queryFn: leerAperturaAbierta,
        staleTime: Infinity
    })