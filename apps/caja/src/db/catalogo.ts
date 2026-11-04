import { Cambios, RespuestaBajada } from "../lib/api";
import { sentenciaAjuste } from "./ajustes";
import { obtenerDb, Sentencia, transaccion } from "./conexion";

const TABLAS: Record<keyof Cambios, { tabla: string, columnas: string[]}> = {
    envases: { tabla: 'Envase', columnas: ['id', 'nombre', 'orden', 'activo']},
    categorias: {tabla: "Categoria", columnas: ["id", "nombre", "orden", "activo"]},
     productos: { tabla: "Producto", columnas: ["id", "categoriaId", "nombre", "orden", "activo"] },
    variantes: { tabla: "Variante", columnas: ["id", "productoId", "envaseId", "precio", "activo"] },
    promociones: {
        tabla: "Promocion",
        columnas: ["id", "nombre", "tipo", "llevar", "pagar", "porcentaje", "monto", "dias", "horaDesde", "horaHasta", "pausada", "activo"]
    },
    promocionAlcances: { tabla: "PromocionAlcance", columnas: ["id", "promocionId", "productoId", "categoriaId", "activo"] },
    promocionEnvases: { tabla: "PromocionEnvase", columnas: ["id", "promocionId", "envaseId", "activo"] },
    usuarios: { tabla: "Usuario", columnas: ["id", "nombre", "rol", "pinHash", "activo"] }
}

export const leerVersion = async () => {
    const db = await obtenerDb();
    const filas =  await db.select<{valor: string }[]>(
        "SELECT valor FROM Ajustes where clave = 'versionCatalogo'"
    );
    return Number(filas[0]?.valor ?? 0);
}

export const aplicarCambios = ({version, caja, cambios, config}: RespuestaBajada, remplazar = false) => {
    const sentencias: Sentencia[] = [];

    for(const clave of Object.keys(TABLAS) as (keyof Cambios)[]){
        const {tabla, columnas} = TABLAS[clave];
        const marcadores = columnas.map((_, i) => `$${i + 1}`).join(", ");

        if(remplazar) sentencias.push({ sql: `DELETE FROM ${tabla}`});

        for (const fila of cambios[clave]){
            sentencias.push({
                sql: `INSERT OR REPLACE INTO ${tabla} (${columnas.join(", ")}) VALUES (${marcadores})`,
                valores: columnas.map((columna) => fila[columna])
            });
        }
    }

    sentencias.push(sentenciaAjuste("versionCatalogo", String(version)))
    sentencias.push(sentenciaAjuste("cajaNombre", caja.nombre));
    sentencias.push(sentenciaAjuste('jornadaActiva', String(config.jornadaActiva)))
    sentencias.push(sentenciaAjuste('claveLetra', config.claveLetra))

    return transaccion(sentencias)
}