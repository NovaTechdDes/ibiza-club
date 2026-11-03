import { obtenerDb, Sentencia, transaccion } from "./conexion";

export type Vinculacion = {
    apiUrl: string;
    token: string;
    cajaNombre: string;
};

export const sentenciaAjuste = (clave: string, valor: string): Sentencia => ({
    sql: `INSERT INTO Ajustes (clave, valor) VALUES ($1, $2) ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor`,
    valores: [clave, valor]
})

export const leerVinculacion = async (): Promise<Vinculacion | null> => {
    const db = await obtenerDb();

    const filas = await db.select<{clave: string; valor: string}[]>(
        "SELECT clave, valor FROM Ajustes Where clave IN ('apiUrl', 'token', 'cajaNombre')"
    );
    const ajustes = new Map(filas.map((fila) => [fila.clave, fila.valor]));

    const apiUrl = ajustes.get('apiUrl');
    const token = ajustes.get('token');
    const cajaNombre = ajustes.get('cajaNombre')

    if (!apiUrl || !token || !cajaNombre) return null;

    return {apiUrl, token, cajaNombre}
};


export const guardarVinculacion = (vinculacion: Vinculacion) => 
    transaccion(
        Object.entries(vinculacion).map(([clave, valor]) => sentenciaAjuste(clave, valor))
    );