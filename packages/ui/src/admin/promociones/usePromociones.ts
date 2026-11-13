import { useQuery } from "@tanstack/react-query";
import { useApiAdmin } from "../api";
import { type DiaPromocion, type TipoPromocion } from "@ibiza/shared";

export const CLAVE_PROMOCIONES = ["admin", "promociones"] as const;

export type PromocionListada = {
    id:number;
    nombre: string;
    tipo: TipoPromocion;
    llevar: number | null;
    pagar: number | null;
    porcentaje: number | null;
    monto: number | null;
    dias: DiaPromocion;
    horaDesde: string | null;
    horaHasta: string | null;
    pausada: boolean;
    activo: boolean;
    version: number;

    productoIds: number[];
    categoriaIds: number[];
    envaseIds: number[];
}

export function usePromociones(){
    const { api } = useApiAdmin();
    return useQuery({
        queryKey: CLAVE_PROMOCIONES,
        queryFn: async () => (await api.get<PromocionListada[]>("/promociones")).data
    })
}