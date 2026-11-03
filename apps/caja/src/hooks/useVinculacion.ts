import { useQuery } from "@tanstack/react-query";
import { leerVinculacion } from "../db/ajustes";

export const CLAVE_VINCULACION = ["vinculacion"];

export const useVinculacion = () => 
    useQuery({
        queryKey: CLAVE_VINCULACION,
        queryFn: leerVinculacion,
        // Solo cambia al vincular, y ahí se actualiza a mano
        staleTime: Infinity
    });
    