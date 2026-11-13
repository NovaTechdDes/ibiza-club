import { useQuery } from "@tanstack/react-query";
import { useApiAdmin } from "../api";
import type { Categoria } from "@ibiza/shared";

export const CLAVE_CATEGORIAS = ["admin", "categorias"] as const;

export function useCategorias(){
    const { api } = useApiAdmin();
    return useQuery({
        queryKey: CLAVE_CATEGORIAS,
        queryFn: async () => (await api.get<Categoria[]>("/categorias")).data,
    })
}