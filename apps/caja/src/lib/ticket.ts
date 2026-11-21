import { horaLocal, NOMBRE_MEDIO, type MedioPago } from "@ibiza/shared";

import type { Jornada } from "../db/apertura";
import type { LineaVenta } from "../hooks/useCarritoCalculado";
import type { Ticket } from "./impresora";

const DIAS = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];

// "2026-10-23" -> "VIE 23/10". En UTC: con la hora local (UTC-3) daría el día anterior
export const fechaTicket = (fecha: string) => {
  const [anio, mes, dia] = fecha.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const diaSemana = DIAS[new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()];
  const dosCifras = (n: number) => String(n).padStart(2, "0");
  return `${diaSemana} ${dosCifras(dia)}/${dosCifras(mes)}`;
};

type DatosTicket = {
  jornada: Jornada;
  caja: string;
  numero: number;
  lineas: LineaVenta[];
  total: number;
  medioPago: MedioPago;
  instante: Date;
  conEnvase: boolean;
};

// Arma el contenido; cómo se ve en el papel lo decide Rust
export const armarTicket = ({
  jornada,
  caja,
  numero,
  lineas,
  total,
  medioPago,
  instante,
  conEnvase,
}: DatosTicket): Ticket => ({
  letra: jornada.letra,
  fecha: fechaTicket(jornada.fecha),
  caja,
  numero,
  lineas: lineas.map((linea) => ({
    cantidad: linea.cantidad,
    nombre: conEnvase ? `${linea.nombre} (${linea.envaseNombre})` : linea.nombre,
    precioUnitario: linea.precio,
    promocionNombre: linea.promocionNombre,
    descuento: linea.descuento,
  })),
  total,
  medioPago: NOMBRE_MEDIO[medioPago],
  hora: horaLocal(instante),
});
