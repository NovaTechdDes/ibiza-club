import { type RangoReporte, type TipoPromocion } from "@ibiza/shared";
import { useReporte } from "./useReportes";

import estilos from "./Reportes.module.css";
import { mensajeDeError } from "../api";
import { pesos, porcentaje } from "./formato";

type PromoUsada = {
  promocionId: number;
  nombre: string;
  tipo: TipoPromocion;
  lineas: number;
  unidades: number;
  descuento: number;
};

type ReportePromo = RangoReporte & {
  promos: PromoUsada[];
  totalDescuento: number;
};

const TEXTO_TIPO: Record<TipoPromocion, string> = {
  NXM: "N X M",
  PORCENTAJE: "Porcentaje",
  MONTO_FIJO: "Monto fijo",
};

export function VentasPorPromo({ rango }: { rango: RangoReporte }) {
  const reporte = useReporte<ReportePromo>("/ventas/promo", rango);

  if (reporte.isPending) return <p className={estilos.ayuda}>Cargando...</p>;
  if (reporte.isError) {
    return (
      <p className={estilos.error}>
        {mensajeDeError(reporte.error, "No se pudo cargar el reporte.")}
      </p>
    );
  }

  const { promos, totalDescuento } = reporte.data;

  if (promos.length === 0) {
    return (
      <p className={estilos.ayuda}>Ninguna promo se aplicó en este rango.</p>
    );
  }

  const totalUnidades = promos.reduce((acc, promo) => acc + promo.unidades, 0);

  return (
    <div
      className={`${estilos.reporte} ${reporte.isPlaceholderData ? estilos.actualizando : ""}`}
    >
      <div className={estilos.desplazable}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th>Promo</th>
              <th className={estilos.texto}>Tipo</th>
              <th>Líneas</th>
              <th>Unidades</th>
              <th>Descuento</th>
              <th>Del descuento</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((promo) => (
              <tr key={promo.promocionId}>
                <td>{promo.nombre}</td>
                <td className={estilos.texto}>{TEXTO_TIPO[promo.tipo]}</td>
                <td>{promo.lineas}</td>
                <td>{promo.unidades}</td>
                <td>{pesos(promo.descuento)}</td>
                <td>{porcentaje(promo.descuento, totalDescuento)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td />
              <td />
              <td>{totalUnidades}</td>
              <td>{pesos(totalDescuento)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
