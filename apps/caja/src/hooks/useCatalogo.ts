import { useQuery } from "@tanstack/react-query"
import { leerCategoriasVenta } from "../db/productos"
import { leerPromociones } from "../db/promociones"

export const CLAVE_CATALOGO = ['catalogo']

export const useCategoriaVenta = () => 
    useQuery({
        queryKey: [...CLAVE_CATALOGO, 'categorias'],
        queryFn: leerCategoriasVenta,
        staleTime: Infinity
    })

export const usePromos = () => 
    useQuery({
        queryKey: [...CLAVE_CATALOGO, 'promos'],
        queryFn: leerPromociones,
        staleTime: Infinity
    })