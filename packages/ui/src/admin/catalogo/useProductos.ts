import { useQuery } from "@tanstack/react-query";
import { useApiAdmin } from "../api";
import type { Producto } from "@ibiza/shared";

export const CLAVE_PRODUCTOS = ["admin", "productos"] as const;

export function useProductos() {
    const { api } = useApiAdmin();
    return useQuery({
        queryKey: CLAVE_PRODUCTOS,
        queryFn: async () => (await api.get<Producto[]>("/productos")).data,
    });
}
