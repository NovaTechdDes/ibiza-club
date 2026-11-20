import { useState } from "react";
import { cerrarCaja, type ResultadoCierre } from "../db/cierre";
import { useSesion } from "../stores/sesion";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { CLAVE_APERTURA, useApertura } from "../hooks/useApertura";
import { avisarOperacionNueva } from "../hooks/useSubida";
import { Boton, TecladoNumerico } from "@ibiza/ui";

import estilos from "./PantallaCierre.module.css";
import { PedirPin } from "../componentes/PedirPin";
import { Acciones, Cifra, Dialogo, Mensaje } from "../componentes/Dialogo";
import type { Usuario } from "../db/usuario";
import { fechaDeApertura, horaLocal } from "@ibiza/shared";
import { confirmar } from "../lib/alertas";
import { useVinculacion } from "../hooks/useVinculacion";
import { useImpresora } from "../hooks/useImpresora";
import { imprimirCierre, imprimirConReintento } from "../lib/impresora";
import { fechaTicket } from "../lib/ticket";
import { puedeAutorizar, ROLES_AUTORIZAN } from "../lib/autorizacion";

const MONTO_MAXIMO = 99_999_999;

interface Props {
  onVolver: () => void;
  pendiente?: boolean;
}

export const PantallaCierre = ({ onVolver, pendiente = false }: Props) => {
  const queryClient = useQueryClient();

  const [contado, setContado] = useState(0);
  const [pidiendoPin, setPidiendoPin] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCierre | null>(null);

  const { data: vinculacion } = useVinculacion();
  const { data: config } = useImpresora();
  const usuario = useSesion((estado) => estado.usuario);

  const salir = useSesion((e) => e.salir);

  const { data: apertura } = useApertura();

  const cerrar = useMutation({
    mutationFn: async (encargado: Usuario) => {
      if (!apertura || !vinculacion || !usuario)
        throw new Error("Falta la apertura, la vinculación o el cajero");

      const r = await cerrarCaja({
        aperturaId: apertura.id,
        cerradoPorId: encargado.id,
        contado,
        pendiente,
      });
      const ahora = new Date();

      const fecha = fechaDeApertura(apertura);

      await imprimirConReintento(config ?? null, {
        titulo: "No se imprimió el resumen del cierre",
        aclaracion: "La caja ya quedó cerrada.",
        imprimir: (c) =>
          imprimirCierre(c.ip, c.puerto, c.ancho, {
            ...r,
            caja: vinculacion.cajaNombre,
            fecha: fechaTicket(fecha),
            hora: horaLocal(ahora),
            cajero: usuario.nombre,
            cerro: encargado.nombre,
            pendiente,
          }),
      });
      return r;
    },
    onSuccess: (r) => {
      setResultado(r);
      avisarOperacionNueva(queryClient);
    },
  });

  async function pedirConfirmacion() {
    if (
      await confirmar(
        `¿Contaste $ ${contado.toLocaleString("es-AR")}?`,
        "Sí, cerrar",
      )
    ) {
      if (puedeAutorizar(usuario)) cerrar.mutate(usuario);
      else setPidiendoPin(true);
    }
  }

  function teclear(digito: string) {
    cerrar.reset();
    setContado((actual) => {
      const nuevo = actual * 10 + Number(digito);
      return nuevo > MONTO_MAXIMO ? actual : nuevo;
    });
  }

  function borrar() {
    cerrar.reset();
    setContado((actual) => Math.floor(actual / 10));
  }

  async function terminar() {
    salir();
    await queryClient.invalidateQueries({ queryKey: CLAVE_APERTURA });
  }

  if (resultado) {
    const r = resultado;
    const claseDif =
      r.diferencia === 0
        ? estilos.exacto
        : r.diferencia < 0
          ? estilos.falta
          : estilos.sobra;
    const textoDif =
      r.diferencia === 0 ? "Exacto" : r.diferencia < 0 ? "Faltan" : "Sobran";

    return (
      <Dialogo titulo="Caja cerrada">
        <div className={estilos.filas}>
          <Fila etiqueta="Fondo" monto={r.fondo} />
          <Fila etiqueta="Ventas en efectivo" monto={r.efectivo} />
          <Fila etiqueta="Retiros" monto={-r.retiros} />
          <Fila etiqueta="Esperado" monto={r.esperado} destacada />
          <Fila etiqueta="Contado" monto={r.contado} destacada />
        </div>

        <p className={`${estilos.diferencia} ${claseDif}`}>
          {textoDif}
          {r.diferencia !== 0 &&
            ` $ ${Math.abs(r.diferencia).toLocaleString("es-AR")}`}
        </p>

        <div className={estilos.filas}>
          <Fila etiqueta="Tarjeta" monto={r.tarjeta} />
          <Fila etiqueta="Transferencia" monto={r.transferencia} />
          <div className={estilos.fila}>
            <span>Ventas / Anuladas</span>
            <span>
              {r.cantVentas} / {r.cantAnuladas}
            </span>
          </div>
        </div>

        <Acciones>
          <Boton onClick={terminar}>Terminar</Boton>
        </Acciones>
      </Dialogo>
    );
  }

  if (pidiendoPin) {
    return (
      <PedirPin
        titulo="¿Quién autoriza el cierre?"
        roles={ROLES_AUTORIZAN}
        onCancelar={() => setPidiendoPin(false)}
        onCorrecto={(encargado) => {
          setPidiendoPin(false);
          cerrar.mutate(encargado);
        }}
      />
    );
  }
  return (
    <Dialogo
      titulo={pendiente ? "Cierre pendiente" : "Cierre de caja"}
      ayuda={
        pendiente
          ? `La caja quedó abierta desde ${apertura ? fechaTicket(fechaDeApertura(apertura)) : "otra noche"}. Contá el efectivo y cerrala para empezar la noche.`
          : "Contá el efectivo de la caja y cargá el total."
      }
    >
      <Cifra prefijo="$">{contado.toLocaleString("es-AR")}</Cifra>
      <Mensaje>
        {cerrar.isError &&
          (cerrar.error instanceof Error
            ? cerrar.error.message
            : "No se pudo cerrar la caja")}
      </Mensaje>
      <TecladoNumerico onDigito={teclear} onBorrar={borrar} />
      <Acciones>
        <Boton
          variante="secundario"
          disabled={cerrar.isPending}
          onClick={onVolver}
        >
          Cancelar
        </Boton>
        <Boton disabled={cerrar.isPending} onClick={pedirConfirmacion}>
          {cerrar.isPending ? "Cerrando..." : "Cerrar caja"}
        </Boton>
      </Acciones>
    </Dialogo>
  );
};

const Fila = ({
  etiqueta,
  monto,
  destacada,
}: {
  etiqueta: string;
  monto: number;
  destacada?: boolean;
}) => (
  <div className={`${estilos.fila} ${destacada ? estilos.destacada : ""}`}>
    <span>{etiqueta}</span>
    <span>$ {monto.toLocaleString("es-AR")}</span>
  </div>
);
