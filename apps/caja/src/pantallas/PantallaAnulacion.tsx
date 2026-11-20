import { horaLocal, NOMBRE_MEDIO } from "@ibiza/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Boton, TecladoNumerico } from "@ibiza/ui";
import { buscarVentaParaAnular, registrarAnulacion } from "../db/anulacion";
import type { Usuario } from "../db/usuario";
import { useApertura } from "../hooks/useApertura";
import { useSesion } from "../stores/sesion";
import { avisarOperacionNueva } from "../hooks/useSubida";
import { PedirPin } from "../componentes/PedirPin";
import {
  Acciones,
  Cifra,
  Dialogo,
  Mensaje,
  Opciones,
} from "../componentes/Dialogo";

import estilos from "./PantallaAnulacion.module.css";
import { puedeAutorizar, ROLES_AUTORIZAN } from "../lib/autorizacion";
import { confirmar } from "../lib/alertas";

const NUMERO_MAXIMO = 99_999;
const MOTIVOS_ANULACION = [
  "Error del cajero",
  "Medio de pago equivocado",
  "Cliente se arrepintió",
  "Otro",
];

interface Props {
  onVolver: () => void;
}

const mensaje = (error: unknown, porDefecto: string) =>
  error instanceof Error ? error.message : porDefecto;

export const PantallaAnulacion = ({ onVolver }: Props) => {
  const queryClient = useQueryClient();
  const { data: apertura } = useApertura();
  const usuario = useSesion((estado) => estado.usuario);

  const [numero, setNumero] = useState(0);
  const [motivo, setMotivo] = useState<string | null>(null);
  const [pidiendoPin, setPidiendoPin] = useState(false);

  const buscar = useMutation({
    mutationFn: async () => {
      if (!apertura) throw new Error("No hay caja abierta");
      const venta = await buscarVentaParaAnular(apertura.id, numero);
      if (!venta)
        throw new Error(`No existe el ticket #${numero} en esta caja`);
      if (venta.anulada)
        throw new Error(`El ticket #${numero} ya está anulado`);
      return venta;
    },
  });
  const venta = buscar.data;

  const anular = useMutation({
    mutationFn: async (encargado: Usuario) => {
      if (!venta || !motivo || !usuario)
        throw new Error("Falta la venta, el motivo o el cajero");
      await registrarAnulacion({
        ventaId: venta.id,
        numero: venta.numero,
        total: venta.total,
        motivo,
        encargadoId: encargado.id,
        cajeroId: usuario.id,
      });
    },
    onSuccess: () => {
      avisarOperacionNueva(queryClient);
      onVolver();
    },
  });

  function teclear(digito: string) {
    buscar.reset();
    setNumero((actual) => {
      const nuevo = actual * 10 + Number(digito);
      return nuevo > NUMERO_MAXIMO ? actual : nuevo;
    });
  }

  function borrar() {
    buscar.reset();
    setNumero((actual) => Math.floor(actual / 10));
  }

  function otroTicket() {
    buscar.reset();
    anular.reset();
    setMotivo(null);
    setNumero(0);
  }

  async function pedirAutorizacion() {
    if (!venta) return;
    if (!puedeAutorizar(usuario)) {
      setPidiendoPin(true);
      return;
    }
    if (
      await confirmar(
        `¿Anular el ticket #${venta.numero} de $ ${venta.total.toLocaleString("es-AR")}?`,
        "Sí, anular",
        { peligro: true },
      )
    )
      anular.mutate(usuario);
  }

  if (pidiendoPin) {
    return (
      <PedirPin
        titulo="¿Quién autoriza la anulación?"
        roles={ROLES_AUTORIZAN}
        onCancelar={() => setPidiendoPin(false)}
        onCorrecto={(encargado) => {
          setPidiendoPin(false);
          anular.mutate(encargado);
        }}
      />
    );
  }

  // Etapa 1: buscar el ticket por número
  if (!venta) {
    return (
      <Dialogo
        titulo="Anular venta"
        ayuda="Pedí el ticket físico y cargá su número."
      >
        <Cifra prefijo="#">{numero}</Cifra>
        <Mensaje>
          {buscar.isError &&
            mensaje(buscar.error, "No se pudo buscar el ticket")}
        </Mensaje>
        <TecladoNumerico onDigito={teclear} onBorrar={borrar} />
        <Acciones>
          <Boton variante="secundario" onClick={onVolver}>
            Cancelar
          </Boton>
          <Boton
            disabled={numero === 0 || buscar.isPending}
            onClick={() => buscar.mutate()}
          >
            {buscar.isPending ? "Buscando..." : "Buscar"}
          </Boton>
        </Acciones>
      </Dialogo>
    );
  }

  // Etapa 2: comparar con el ticket físico, elegir motivo y anular
  return (
    <Dialogo
      titulo={`Ticket #${venta.numero}`}
      ayuda="Compará con el ticket físico antes de anular."
    >
      {/* Se ve como el ticket impreso: renglones con cantidad y nombre, total abajo */}
      <div className={estilos.ticket}>
        <p className={estilos.meta}>
          {horaLocal(new Date(venta.ocurridaEn))} hs ·{" "}
          {NOMBRE_MEDIO[venta.medioPago]}
        </p>
        <ul className={estilos.items}>
          {venta.items.map((item, i) => (
            <li key={i}>
              <span className={estilos.cantidad}>{item.cantidad} x</span>
              {item.nombre}
            </li>
          ))}
        </ul>
        <p className={estilos.total}>
          <span>Total</span>
          <span>$ {venta.total.toLocaleString("es-AR")}</span>
        </p>
      </div>

      <Opciones
        opciones={MOTIVOS_ANULACION}
        elegida={motivo}
        onElegir={(elegido) => {
          setMotivo(elegido);
          anular.reset();
        }}
      />

      <Mensaje>
        {anular.isError && mensaje(anular.error, "No se pudo anular la venta")}
      </Mensaje>

      {/* Anular en rojo: es lo único de estas pantallas que da vuelta una venta */}
      <Acciones>
        <Boton
          variante="secundario"
          disabled={anular.isPending}
          onClick={otroTicket}
        >
          Otro ticket
        </Boton>
        <Boton
          variante="peligro"
          disabled={!motivo || anular.isPending}
          onClick={pedirAutorizacion}
        >
          {anular.isPending ? "Anulando..." : "Anular"}
        </Boton>
      </Acciones>
    </Dialogo>
  );
};
