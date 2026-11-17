import { useQuery } from "@tanstack/react-query";
import { useApiAdmin } from "../api";
import { UsuarioListado } from "@ibiza/shared";

export const CLAVE_USUARIOS = ["admin", "usuarios"] as const;

export function useUsuarios(){
    const { api } = useApiAdmin();
    
    return useQuery({
        queryKey: CLAVE_USUARIOS,
        queryFn: async () => (await api.get<UsuarioListado[]>("/usuarios")).data
    })
}