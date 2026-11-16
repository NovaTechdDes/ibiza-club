import { type MedioPago, NOMBRE_MEDIO, type RangoReporte } from "@ibiza/shared";
import { useReporte } from "./useReportes";

import estilos from "./Reportes.module.css";
import { mensajeDeError } from "../api";
import { pesos, porcentaje } from "./formato";

type Montos = {
  ventas: number;
  subTotal: number;
  descuento: number;
  total: number;
};

type ReporteMedioPago = RangoReporte & {
  medios: (Montos & { medioPago: MedioPago })[];
  totales: Montos;
  anuladas: number;
};

export function VentasPorMedio({ rango }: { rango: RangoReporte }) {
  const reporte = useReporte<ReporteMedioPago>("/ventas/medio-pago", rango);

  if (reporte.isPending) return <p className={estilos.ayuda}>Cargando...</p>;
  if (reporte.isError) {
    return (
      <p className={estilos.error}>
        {mensajeDeError(reporte.error, "No se pudo cargar el reporte.")}
      </p>
    );
  }

  const { medios, totales, anuladas } = reporte.data;

  return (
    <div
      className={`${estilos.reporte} ${reporte.isPlaceholderData ? estilos.actualizando : ""}`}
    >
      <div className={estilos.desplazable}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th>Medio</th>
              <th>Ventas</th>
              <th>Subtotal</th>
              <th>Descuento</th>
              <th>Total</th>
              <th>Del Total</th>
            </tr>
          </thead>
          <tbody>
            {medios.map((medio) => (
              <tr key={medio.medioPago}>
                <td>{NOMBRE_MEDIO[medio.medioPago]}</td>
                <td>{medio.ventas}</td>
                <td>{pesos(medio.subTotal)}</td>
                <td>{pesos(medio.descuento)}</td>
                <td>{pesos(medio.total)}</td>
                <td>{porcentaje(medio.total, totales.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td>{totales.ventas}</td>
              <td>{pesos(totales.subTotal)}</td>
              <td>{pesos(totales.descuento)}</td>
              <td>{pesos(totales.total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <p className={estilos.ayuda}>
        {anuladas === 0
          ? "No hubo ventas anuladas."
          : `${anuladas} ${anuladas === 1 ? "venta anulada" : "ventas anuladas"} (no suman en los totales).`}
      </p>
    </div>
  );
}
