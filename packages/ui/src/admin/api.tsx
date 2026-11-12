import axios, { type AxiosInstance } from "axios";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSesionAdmin } from "./sesion";

// Cliente de la API para la administración. Es distinto del de la caja:
// usa el JWT del login (email y contraseña), no el token de dispositivo.
export const crearApiAdmin = (apiUrl: string): AxiosInstance => {
    const api = axios.create({ baseURL: `${apiUrl}/api`, timeout: 30_000 });

    // El token se lee en cada pedido: así no hay que recrear el cliente al entrar o salir.
    api.interceptors.request.use((config) => {
        const { token } = useSesionAdmin.getState();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    });

    // 401 con sesión abierta = token vencido, usuario dado de baja o sin acceso:
    // se cierra la sesión y vuelve el login. El 401 del propio login no cuenta
    // (ahí todavía no hay token y significa "credenciales inválidas").
    api.interceptors.response.use(undefined, (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401 && useSesionAdmin.getState().token) {
            useSesionAdmin.getState().salir();
        }
        return Promise.reject(error);
    });

    return api;
};

type ContextoAdmin = { api: AxiosInstance; apiUrl: string };

const Contexto = createContext<ContextoAdmin | null>(null);

export function ProveedorApiAdmin({ apiUrl, children }: { apiUrl: string; children: ReactNode }) {
    const valor = useMemo(() => {
        // Sin barra final: la URL se concatena con /api
        const url = apiUrl.replace(/\/+$/, "");
        return { api: crearApiAdmin(url), apiUrl: url };
    }, [apiUrl]);

    return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

// Las pantallas de administración (F17 en adelante) piden la API con este hook.
export const useApiAdmin = () => {
    const contexto = useContext(Contexto);
    if (!contexto) throw new Error("useApiAdmin se usa dentro de <Administracion>");
    return contexto;
};

// Mensaje para mostrarle a la persona a partir de un error de la API.
export const mensajeDeError = (error: unknown, porDefecto = "Algo salió mal. Probá de nuevo."): string => {
    if (!axios.isAxiosError(error)) return porDefecto;
    if (!error.response) return "No se pudo conectar con el servidor. Revisá el internet.";

    const mensaje = (error.response.data as { error?: { mensaje?: unknown } } | undefined)?.error?.mensaje;
    return typeof mensaje === "string" ? mensaje : porDefecto;
};
