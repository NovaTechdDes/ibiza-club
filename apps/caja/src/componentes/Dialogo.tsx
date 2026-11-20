import type { ReactNode } from "react";
import { Tarjeta } from "@ibiza/ui";
import estilos from "./Dialogo.module.css";

/*
 * Piezas de las pantallas secundarias (PIN, apertura, retiro, cambio de cajero,
 * anulación, cierre, impresora, vincular, actualización). Todas comparten tamaño,
 * márgenes y escala: si algo se tiene que ver distinto en todas, se cambia acá.
 */

type Tamaño = "chico" | "medio" | "grande";

type DialogoProps = {
  titulo: ReactNode;
  ayuda?: ReactNode;
  // chico: teclado numérico · medio: formularios · grande: dos columnas
  tamaño?: Tamaño;
  children: ReactNode;
};

export function Dialogo({ titulo, ayuda, tamaño = "chico", children }: DialogoProps) {
  return (
    <div className={estilos.pantalla}>
      <Tarjeta className={`${estilos.tarjeta} ${estilos[tamaño]}`}>
        <header className={estilos.cabecera}>
          <h1 className={estilos.titulo}>{titulo}</h1>
          {ayuda && <p className={estilos.ayuda}>{ayuda}</p>}
        </header>
        {children}
      </Tarjeta>
    </div>
  );
}

// El número que se está tecleando (monto o número de ticket), como el visor de una calculadora
export function Cifra({ prefijo, children }: { prefijo: string; children: ReactNode }) {
  return (
    <p className={estilos.cifra}>
      <span className={estilos.prefijo}>{prefijo}</span>
      {children}
    </p>
  );
}

/*
 * Siempre ocupa su lugar aunque esté vacío: así el teclado no se mueve bajo el dedo
 * cuando aparece un error. role="alert" hace que se anuncie al cambiar el texto.
 */
export function Mensaje({
  tipo = "error",
  children,
}: {
  tipo?: "error" | "aviso";
  children?: ReactNode;
}) {
  return (
    <p className={`${estilos.mensaje} ${estilos[tipo]}`} role="alert">
      {children}
    </p>
  );
}

// Fila de botones del pie. Si no entran todos, bajan a otra fila en vez de apretarse
export function Acciones({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`${estilos.acciones} ${className}`}>{children}</div>;
}

type OpcionesProps = {
  opciones: readonly string[];
  elegida: string | null;
  onElegir: (opcion: string) => void;
  columnas?: 1 | 2;
};

// Elegir una de varias (motivo de retiro, de anulación). La elegida se marca con aria-pressed
export function Opciones({ opciones, elegida, onElegir, columnas = 2 }: OpcionesProps) {
  return (
    <div className={`${estilos.opciones} ${columnas === 1 ? estilos.unaColumna : ""}`}>
      {opciones.map((opcion) => (
        <button
          key={opcion}
          type="button"
          className={estilos.opcion}
          aria-pressed={opcion === elegida}
          onClick={() => onElegir(opcion)}
        >
          {opcion}
        </button>
      ))}
    </div>
  );
}
