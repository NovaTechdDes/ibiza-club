import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useApiAdmin } from "./api";

const INTERVALO_MS = 15_000;

// ¿Se llega a la API? No alcanza con navigator.onLine: en el boliche el router
// sigue andando aunque se caiga internet, y el navegador diría "en línea".
// Por eso se le pega a /health cada 15 segundos.
export const useEnLinea = (): boolean => {
    const { apiUrl } = useApiAdmin();

    const { isError } = useQuery({
        queryKey: ["admin", "en-linea", apiUrl],
        queryFn: async () => {
            await axios.get(`${apiUrl}/health`, { timeout: 8_000 });
            return true;
        },
        refetchInterval: INTERVALO_MS,
        refetchOnWindowFocus: true,
        retry: false,
        // 'always': que pregunte igual aunque el navegador crea que no hay red.
        networkMode: "always"
    });

    // Mientras llega la primera respuesta se asume que hay conexión, para no mostrar el aviso de más.
    return !isError;
};
