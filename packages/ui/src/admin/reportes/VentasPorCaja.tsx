import {
  MEDIOS_PAGO,
  type MedioPago,
  NOMBRE_MEDIO,
  NOMBRE_TIPO_CAJA,
  type RangoReporte,
  type TipoCaja,
} from "@ibiza/shared";
import { mensajeDeError } from "../api";
import { pesos } from "./formato";
import estilos from "./Reportes.module.css";
import { useReporte } from "./useReportes";

// Lo que devuelve GET /reportes/ventas/caja (ventasPorCaja en la API).
// La API no exporta sus tipos: si cambia la respuesta, hay que cambiar esto también.
type Montos = { ventas: number; descuento: number; total: number };

type VentasCaja = Montos & {
  cajaId: number;
  nombre: string;
  barra: string | null;
  porMedio: Record<MedioPago, number>;
  tipo: TipoCaja;
};

type VentasBarra = Montos & { barra: string; cajas: number };
type VentasTipo = Montos & { tipo: TipoCaja; cajas: number };

type ReporteCaja = RangoReporte & {
  cajas: VentasCaja[];
  barras: VentasBarra[];
  anuladas: number;
  tipos: VentasTipo[];
};

export function VentasPorCaja({ rango }: { rango: RangoReporte }) {
  const reporte = useReporte<ReporteCaja>("/ventas/caja", rango);

  if (reporte.isPending) return <p className={estilos.ayuda}>Cargando…</p>;
  if (reporte.isError) {
    return (
      <p className={estilos.error}>
        {mensajeDeError(reporte.error, "No se pudo cargar el reporte.")}
      </p>
    );
  }

  const { cajas, barras, tipos, anuladas } = reporte.data;

  if (cajas.length === 0) {
    return <p className={estilos.ayuda}>No hay cajas dadas de alta.</p>;
  }

  // A diferencia de medio-pago, esta ruta no manda totales: se suman acá
  const totales = cajas.reduce(
    (acc, caja) => ({
      ventas: acc.ventas + caja.ventas,
      descuento: acc.descuento + caja.descuento,
      total: acc.total + caja.total,
    }),
    { ventas: 0, descuento: 0, total: 0 },
  );
  const totalDelMedio = (medio: MedioPago) =>
    cajas.reduce((acc, caja) => acc + caja.porMedio[medio], 0);

  // Si ninguna caja tiene barra, la API manda una sola fila "Sin barra" que no aporta nada.
  // Se mira en las cajas y no en ese texto, para no depender de cómo lo escribe la API.
  const hayBarras = cajas.some((caja) => caja.barra !== null);

  // Sin cajas de entrada, la columna Tipo diría "Barra" en todas las filas y la tabla por tipo
  // repetiría el total. Igual que con las barras, se decide mirando las cajas.
  const hayEntradas = cajas.some((caja) => caja.tipo === "ENTRADA");

  const clases = `${estilos.reporte} ${reporte.isPlaceholderData ? estilos.actualizando : ""}`;

  return (
    <div className={clases}>
      <div className={estilos.desplazable}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th>Caja</th>
              <th>Barra</th>
              {hayEntradas && <th>Tipo</th>}
              <th>Ventas</th>
              {/* Una columna por medio: si se suma uno en shared, aparece solo */}
              {MEDIOS_PAGO.map((medio) => (
                <th key={medio}>{NOMBRE_MEDIO[medio]}</th>
              ))}
              <th>Descuento</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {cajas.map((caja) => (
              <tr
                key={caja.cajaId}
                className={caja.ventas === 0 ? estilos.sinVentas : undefined}
              >
                <td>{caja.nombre}</td>
                <td>{caja.barra ?? "—"}</td>
                {hayEntradas && <td>{NOMBRE_TIPO_CAJA[caja.tipo]}</td>}
                <td>{caja.ventas}</td>
                {MEDIOS_PAGO.map((medio) => (
                  <td key={medio}>{pesos(caja.porMedio[medio])}</td>
                ))}
                <td>{pesos(caja.descuento)}</td>
                <td>{pesos(caja.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td />
              {hayEntradas && <td />}
              <td>{totales.ventas}</td>
              {MEDIOS_PAGO.map((medio) => (
                <td key={medio}>{pesos(totalDelMedio(medio))}</td>
              ))}
              <td>{pesos(totales.descuento)}</td>
              <td>{pesos(totales.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {hayEntradas && (
        <>
          <h3 className={estilos.subtitulo}>Por tipo de caja</h3>
          <div className={estilos.desplazable}>
            <table className={estilos.tabla}>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Cajas</th>
                  <th>Ventas</th>
                  <th>Descuento</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {tipos.map((t) => (
                  <tr key={t.tipo}>
                    <td>{NOMBRE_TIPO_CAJA[t.tipo]}</td>
                    <td>{t.cajas}</td>
                    <td>{t.ventas}</td>
                    <td>{pesos(t.descuento)}</td>
                    <td>{pesos(t.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {hayBarras && (
        <>
          <h3 className={estilos.subtitulo}>Por barra</h3>
          <div className={estilos.desplazable}>
            <table className={estilos.tabla}>
              <thead>
                <tr>
                  <th>Barra</th>
                  <th>Cajas</th>
                  <th>Ventas</th>
                  <th>Descuento</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {barras.map((barra) => (
                  <tr key={barra.barra}>
                    <td>{barra.barra}</td>
                    <td>{barra.cajas}</td>
                    <td>{barra.ventas}</td>
                    <td>{pesos(barra.descuento)}</td>
                    <td>{pesos(barra.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className={estilos.ayuda}>
        {anuladas === 0
          ? "No hubo ventas anuladas."
          : `${anuladas} ${anuladas === 1 ? "venta anulada" : "ventas anuladas"} (no suman en los totales).`}
      </p>
    </div>
  );
}
