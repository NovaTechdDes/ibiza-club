import type { EstadoOrdenQr, OperacionSubida, OrdenQr, TipoCaja } from "@ibiza/shared";
import axios from "axios";
import type { Rechazada, RefOperacion } from "../db/cola";

const ESPERA_PAGO_QR = 15_000;

type CajaRemota = {
    id: number;
    nombre: string;
    barra: string | null;
    aumentoPorcentaje: number;
    tipo: TipoCaja;
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
export type RespuestaSubida = {
    confirmadas: RefOperacion[],
    rechazada: Rechazada | null
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

export const enviarLote = async (apiUrl: string, token: string, operaciones: OperacionSubida[]) => {
    const { data } = await crearApi(apiUrl, token).post<RespuestaSubida>(
        "/sync/subida", {operaciones}
    )

    return data;
};

export const pedirCaja = async (apiUrl: string, token: string) => {
    const { caja } = await pedirCambios(apiUrl, token, 0);
    return caja;
};

export const crearOrdenQr = async (apiUrl: string, token: string, total: number, clave: string) => {
    const { data } = await crearApi(apiUrl, token).post<OrdenQr>(
        "/pagos-qr", { total, clave }, { timeout: ESPERA_PAGO_QR }
    );
    return data;
};

export const consultarOrdenQr = async (apiUrl: string, token: string, ordenId: string) => {
    const { data } = await crearApi(apiUrl, token).get<EstadoOrdenQr>(
        `/pagos-qr/${ordenId}`, { timeout: ESPERA_PAGO_QR }
    );
    return data.estado;
};

export const cancelarOrdenQr = async (apiUrl: string, token: string, ordenId: string) => {
    const { data } = await crearApi(apiUrl, token).post<EstadoOrdenQr>(
        `/pagos-qr/${ordenId}/cancelar`, undefined, { timeout: ESPERA_PAGO_QR }
    );
    return data.estado;
};