import { type RangoReporte } from "@ibiza/shared";
import { useReporte } from "./useReportes";

import estilos from "./Reportes.module.css";
import { mensajeDeError } from "../api";
import { fechaHora, pesos } from "./formato";

type EstadoArqueo = "ABIERTA" | "PENDIENTE" | "CERRADA";

type Arqueo = {
  aperturaId: number;
  caja: string;
  barra: string | null;
  cajero: string;
  fondo: number;
  apertura: string;
  contado: number | null;
  esperado: number | null;
  diferencia: number | null;
  totalTarjeta: number | null;
  totalTransferencia: number | null;
  cerradoPor: string | null;
  cierre: string | null;
  estado: EstadoArqueo;
};

const TEXTO_ESTADO: Record<EstadoArqueo, string> = {
  ABIERTA: "Abierta",
  PENDIENTE: "Pendiente",
  CERRADA: "Cerrada",
};

type ReporteArqueo = RangoReporte & {
  arqueos: Arqueo[];
  totales: {
    contado: number;
    esperado: number;
    diferencia: number;
    abiertas: number;
  };
};

const pesosONada = (monto: number | null) => {
  return monto === null ? "—" : pesos(monto);
};

// Diferencia = contado - esperado: negativa es plata que falta en la caja
function Diferencia({ monto }: { monto: number | null }) {
  if (monto === null) return <>—</>;
  if (monto === 0) return <>Exacto</>;

  const falta = monto < 0;
  return (
    <span className={falta ? estilos.faltante : estilos.sobrante}>
      {falta ? "Faltan" : "Sobran"} {pesos(Math.abs(monto))}
    </span>
  );
}

// "Cerrada · Juan 14/11, 05:48" o solo "Abierta"
const detalleEstado = (a: Arqueo) => {
  const estado = TEXTO_ESTADO[a.estado];
  if (a.cerradoPor === null || a.cierre === null) return estado;
  return `${estado} · ${a.cerradoPor} ${fechaHora(a.cierre)}`;
};

export function Arqueos({ rango }: { rango: RangoReporte }) {
  const reporte = useReporte<ReporteArqueo>("/arqueo", rango);

  if (reporte.isPending) return <p className={estilos.ayuda}>Cargando...</p>;
  if (reporte.isError) {
    return (
      <p className={estilos.error}>
        {mensajeDeError(reporte.error, "No se pudieron cargar los arqueos.")}
      </p>
    );
  }

  const { arqueos, totales } = reporte.data;

  if (arqueos.length === 0) {
    return (
      <p className={estilos.ayuda}>No hubo aperturas de caja en este rango.</p>
    );
  }

  const clases = `${estilos.reporte} ${reporte.isPlaceholderData ? estilos.actualizando : ""}`;

  return (
    <div className={clases}>
      <div className={estilos.desplazable}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th>Caja</th>
              <th className={estilos.texto}>Cajero</th>
              <th>Apertura</th>
              <th>Fondo</th>
              <th>Esperado</th>
              <th>Contado</th>
              <th>Diferencia</th>
              <th>Tarjeta</th>
              <th>Transferencia</th>
              <th className={estilos.texto}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {arqueos.map((a) => (
              <tr key={a.aperturaId}>
                <td>{a.caja}</td>
                <td className={estilos.texto}>{a.cajero}</td>
                <td>{fechaHora(a.apertura)}</td>
                <td>{pesos(a.fondo)}</td>
                <td>{pesosONada(a.esperado)}</td>
                <td>{pesosONada(a.contado)}</td>
                <td>
                  <Diferencia monto={a.diferencia} />
                </td>
                <td>{pesosONada(a.totalTarjeta)}</td>
                <td>{pesosONada(a.totalTransferencia)}</td>
                <td className={estilos.texto}>{detalleEstado(a)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td />
              <td />
              <td />
              <td>{pesos(totales.esperado)}</td>
              <td>{pesos(totales.contado)}</td>
              <td>
                <Diferencia monto={totales.diferencia} />
              </td>
              <td />
              <td />
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {totales.abiertas > 0 && (
        <p className={estilos.ayuda}>
          {totales.abiertas === 1
            ? "1 caja sigue abierta: no entra en los totales."
            : `${totales.abiertas} cajas siguen abiertas: no entran en los totales.`}
        </p>
      )}
    </div>
  );
}
