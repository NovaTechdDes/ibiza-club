import { obtenerDb, Sentencia, transaccion } from "./conexion";

export type Vinculacion = {
    apiUrl: string;
    token: string;
    cajaNombre: string;
};

export type ConfigImpresora = {
    ip: string;
    puerto: number;
    ancho: number;
}

export const leerImpresora = async(): Promise<ConfigImpresora | null> => {
    const db = await obtenerDb();
    const filas = await db.select<{clave: string, valor: string}[]>(
        "SELECT clave, valor FROM Ajustes WHERE clave in ('impresoraIp', 'impresoraPuerto', 'impresoraAncho')"
    )

    const ajustes = new Map(filas.map(fila => [fila.clave, fila.valor]))

    const impresoraIp = ajustes.get('impresoraIp')
    const impresoraPuerto = ajustes.get('impresoraPuerto')
    const impresoraAncho = ajustes.get('impresoraAncho');

    if(!impresoraIp || !impresoraAncho || !impresoraPuerto) return null;

    return {ip: impresoraIp, puerto: Number(impresoraPuerto), ancho: Number(impresoraAncho)}


};

export const guardarImpresora = (config: ConfigImpresora) => 
    transaccion([
        sentenciaAjuste('impresoraIp', config.ip),
        sentenciaAjuste('impresoraPuerto', String(config.puerto)),
        sentenciaAjuste('impresoraAncho', String(config.ancho))]
    )
;

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

export const leerConfigCaja = async (): Promise<{claveLetra: string, jornadaActiva: boolean} | null> => {
    const db = await obtenerDb();
    const filas = await db.select<{clave: string; valor: string}[]>(
        "SELECT clave, valor FROM Ajustes WHERE clave IN ('claveLetra', 'jornadaActiva')"
    );

    const ajustes = new Map(filas.map((fila) => [fila.clave, fila.valor]));

    const claveLetra = ajustes.get('claveLetra');
    const jornadaActiva = ajustes.get('jornadaActiva');

    if(!claveLetra || !jornadaActiva) return null;

    return {
        claveLetra, jornadaActiva: jornadaActiva === 'true'
    }
}

export const guardarVinculacion = (vinculacion: Vinculacion) => 
    transaccion(
        Object.entries(vinculacion).map(([clave, valor]) => sentenciaAjuste(clave, valor))
);
