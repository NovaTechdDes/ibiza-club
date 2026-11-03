import axios from "axios";

type CajaRemota = {
    id: number;
    nombre: string;
    barra: string | null;
};

export const crearApi = (apiUrl: string, token: string) => 
    axios.create({
        baseURL: `${apiUrl}/api`,
        headers: { Authorization: `Bearer ${token}`},
        timeout: 60_000
    });

export const pedirCaja = async (apiUrl: string, token: string) => {
    const { data } = await crearApi(apiUrl, token).get<{ caja: CajaRemota}>(
        "/sync/bajada",
        {params: {desde: 0}}
    );
    return data.caja
}
