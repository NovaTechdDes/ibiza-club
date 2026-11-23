import { type RangoReporte } from "@ibiza/shared";
import { useReporte } from "./useReportes";

import estilos from "./Reportes.module.css";
import { mensajeDeError } from "../api";
import { pesos, porcentaje } from "./formato";

type CajeroDescartes = {
  usuarioId: number;
  nombre: string;
  ventas: number;
  vendido: number;
  vaciados: number;
  montoVaciado: number;
  quitados: number;
  montoQuitado: number;
  descartado: number;
};

type ReporteDescartes = RangoReporte & {
  cajeros: CajeroDescartes[];
  totales: {
    vendido: number;
    vaciados: number;
    quitados: number;
    descartado: number;
  };
};

// Desde qué porcentaje se resalta. Provisorio: ajustarlo cuando haya noches reales
const UMBRAL_AVISO = 10;

// Parte de lo cargado al carrito que terminó descartada.
// Sobre vendido + descartado: un cajero sin ventas que descartó sale 100 % en vez de "-"
function Proporcion({
  vendido,
  descartado,
}: {
  vendido: number;
  descartado: number;
}) {
  if (descartado === 0) return <>—</>;

  const cargado = vendido + descartado;
  const alto = (descartado / cargado) * 100 >= UMBRAL_AVISO;
  return (
    <span className={alto ? estilos.alto : undefined}>
      {porcentaje(descartado, cargado)}
    </span>
  );
}

export function DescartesPorCajero({ rango }: { rango: RangoReporte }) {
  const reporte = useReporte<ReporteDescartes>("/descartes", rango);

  if (reporte.isPending) return <p className={estilos.ayuda}>Cargando...</p>;
  if (reporte.isError) {
    return (
      <p className={estilos.error}>
        {mensajeDeError(reporte.error, "No se pudo cargar el reporte.")}
      </p>
    );
  }

  const { cajeros, totales } = reporte.data;

  if (cajeros.length === 0) {
    return (
      <p className={estilos.ayuda}>
        No hubo ventas ni descartes en este rango.
      </p>
    );
  }

  const totalVentas = cajeros.reduce((acc, cajero) => acc + cajero.ventas, 0);

  return (
    <div
      className={`${estilos.reporte} ${reporte.isPlaceholderData ? estilos.actualizando : ""}`}
    >
      <div className={estilos.desplazable}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th>Cajero</th>
              <th>Ventas</th>
              <th>Vendido</th>
              <th>Vaciados</th>
              <th>Quitados</th>
              <th>Descartado</th>
              <th>% descartado</th>
            </tr>
          </thead>
          <tbody>
            {cajeros.map((cajero) => (
              <tr key={cajero.usuarioId}>
                <td>{cajero.nombre}</td>
                <td>{cajero.ventas}</td>
                <td>{pesos(cajero.vendido)}</td>
                <td>{cajero.vaciados}</td>
                <td>{cajero.quitados}</td>
                <td>{pesos(cajero.descartado)}</td>
                <td>
                  <Proporcion
                    vendido={cajero.vendido}
                    descartado={cajero.descartado}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td>{totalVentas}</td>
              <td>{pesos(totales.vendido)}</td>
              <td>{totales.vaciados}</td>
              <td>{totales.quitados}</td>
              <td>{pesos(totales.descartado)}</td>
              <td>
                <Proporcion
                  vendido={totales.vendido}
                  descartado={totales.descartado}
                />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className={estilos.ayuda}>
        Vaciados: carritos vaciados o abandonados al salir. Quitados: ventas
        cobradas a las que se les restaron ítems. El % es sobre lo cargado al
        carrito (vendido + descartado), a precio de lista.
      </p>
    </div>
  );
}
