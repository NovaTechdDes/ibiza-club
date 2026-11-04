import axios from "axios";

type CajaRemota = {
    id: number;
    nombre: string;
    barra: string | null;
};

type Fila = Record<string, unknown>;

export type Cambios = Record< | "envases" | "categorias" | "productos" | "variantes" | "promociones" | "promocionAlcances" | "promocionEnvases" | "usuarios", Fila[]>

export type RespuestaBajada = {
    version: number;
    ahora: string;
    caja: CajaRemota;
    cambios: Cambios;
    config: {
        jornadaActiva: boolean,
        claveLetra: string
    }
}

export const crearApi = (apiUrl: string, token: string) => 
    axios.create({
        baseURL: `${apiUrl}/api`,
        headers: { Authorization: `Bearer ${token}`},
        timeout: 60_000
    });

export const pedirCambios = async (apiUrl: string, token: string, desde: number) => {
    const { data } = await crearApi(apiUrl, token).get<RespuestaBajada>(
        "/sync/bajada",
        {params: {desde}}
    );
    return data
};

export const pedirCaja = async (apiUrl: string, token: string) => {
    const { caja } = await pedirCambios(apiUrl, token, 0);
    return caja;
};
