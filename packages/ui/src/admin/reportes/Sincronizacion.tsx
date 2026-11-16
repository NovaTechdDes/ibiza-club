import { useEstadoSync } from "./useReportes";

import estilos from "./Reportes.module.css";
import { mensajeDeError } from "../api";
import { haceCuanto } from "./formato";

type EstadoConexion = "CONECTADA" | "SIN_CONTACTO" | "NUNCA";

type EstadoCaja = {
  cajaId: number;
  nombre: string;
  barra: string | null;
  estado: EstadoConexion;
  ultimoContactoEn: string | null;
  ultimaSubidaEn: string | null;
  ultimaVentaRecibidaEn: string | null;
  versionCatalogo: number | null;
  versionesAtrasadas: number | null;
};

type ReporteSync = {
  generadoEn: string;
  versionActual: number;
  cajas: EstadoCaja[];
  totales: { conectadas: number; sinContacto: number; nunca: number };
};

const TEXTO_ESTADO: Record<EstadoConexion, string> = {
  CONECTADA: "Conectada",
  SIN_CONTACTO: "Sin contacto",
  NUNCA: "Nunca se conectó",
};

// string | undefined: con noUncheckedIndexedAccess, cada clase del CSS module puede no existir
const CLASE_ESTADO: Record<EstadoConexion, string | undefined> = {
  CONECTADA: estilos.conectada,
  NUNCA: estilos.nunca,
  SIN_CONTACTO: estilos.sinContacto,
};

const textoCatalogo = (atrasadas: number | null) => {
  if (atrasadas === null) return "—";
  if (atrasadas === 0) return "Al dia";
  if (atrasadas === 1) return "q version atras";
  return `${atrasadas} versiones atras`;
};

export function Sincronizacion() {
  const reporte = useEstadoSync<ReporteSync>();

  if (reporte.isPending) return <p className={estilos.ayuda}>Cargando...</p>;
  if (reporte.isError) {
    return (
      <p className={estilos.error}>
        {mensajeDeError(
          reporte.error,
          "No se pudo cargar el estado de sincronización.",
        )}
      </p>
    );
  }

  const { cajas, totales, generadoEn } = reporte.data;

  if (cajas.length === 0) {
    return <p className={estilos.ayuda}>No hay cajas activas.</p>;
  }

  // Solo los estados que tienen alguna caja: "3 conectadas · 1 sin contacto"
  const plural = (n: number, uno: string, varios: string) =>
    `${n} ${n === 1 ? uno : varios}`;
  const resumen = [
    totales.conectadas > 0 &&
      plural(totales.conectadas, "conectada", "conectadas"),
    totales.sinContacto > 0 &&
      plural(totales.sinContacto, "sin contacto", "sin contacto"),
    totales.nunca > 0 &&
      plural(totales.nunca, "nunca se conectó", "nunca se conectaron"),
  ]
    .filter(Boolean)
    .join(" · ");

  // Con segundos, para que se note que se refresca solo
  const actualizado = new Date(generadoEn).toLocaleTimeString("es-AR");

  return (
    <div className={estilos.reporte}>
      <p className={estilos.subtitulo}>{resumen}</p>

      <div className={estilos.desplazable}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th>Caja</th>
              <th className={estilos.texto}>Estado</th>
              <th className={estilos.texto}>Catálogo</th>
              <th className={estilos.texto}>Último contacto</th>
              <th className={estilos.texto}>Última subida</th>
              <th className={estilos.texto}>Última venta recibida</th>
            </tr>
          </thead>
          <tbody>
            {cajas.map((c) => (
              <tr key={c.cajaId}>
                <td>
                  {c.nombre} {c.barra ? `(${c.barra})` : null}
                </td>
                <td className={estilos.texto}>
                  <span className={CLASE_ESTADO[c.estado]}>
                    {TEXTO_ESTADO[c.estado]}
                  </span>
                </td>
                <td className={estilos.texto}>
                  <span
                    className={
                      (c.versionesAtrasadas ?? 0) > 0
                        ? estilos.atrasada
                        : undefined
                    }
                  >
                    {textoCatalogo(c.versionesAtrasadas)}
                  </span>
                </td>
                <td className={estilos.texto}>
                  {haceCuanto(c.ultimoContactoEn)}
                </td>
                <td className={estilos.texto}>
                  {haceCuanto(c.ultimaSubidaEn)}
                </td>
                <td className={estilos.texto}>
                  {haceCuanto(c.ultimaVentaRecibidaEn)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={estilos.ayuda}>
        Actualizado a las {actualizado} · se refresca cada 30 s
      </p>
    </div>
  );
}
