import { useQuery } from "@tanstack/react-query";
import { useApiAdmin } from "../api";
import type { Envase } from "@ibiza/shared";

export const CLAVE_ENVASES = ["admin", "envases"] as const;

export function useEnvases() {
    const { api } = useApiAdmin();
    return useQuery({
        queryKey: CLAVE_ENVASES,
        queryFn: async () => (await api.get<Envase[]>("/envases")).data,
    });
}
