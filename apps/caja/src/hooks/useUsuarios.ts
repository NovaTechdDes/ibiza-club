import { useQuery } from "@tanstack/react-query";
import { leerUsuarios } from "../db/usuario";

export const CLAVE_USUARIOS = ['usuarios'];

export const useUsuarios = () => 
    useQuery({
        queryKey: CLAVE_USUARIOS,
        queryFn: leerUsuarios,
        staleTime: Infinity
    });