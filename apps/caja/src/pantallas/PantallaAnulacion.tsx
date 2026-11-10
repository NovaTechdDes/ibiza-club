import { horaLocal, type Rol } from "@ibiza/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Boton, Tarjeta, TecladoNumerico } from "@ibiza/ui";
import { buscarVentaParaAnular, registrarAnulacion } from "../db/anulacion";
import type { Usuario } from "../db/usuario";
import { useApertura } from "../hooks/useApertura";
import { useSesion } from "../stores/sesion";
import { avisarOperacionNueva } from "../hooks/useSubida";
import { PedirPin } from "../componentes/PedirPin";

import estilos from "./PantallaAnulacion.module.css";

const ROLES_ANULAN: Rol[] = ["ENCARGADO", "ADMIN"];
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
      if (!venta) throw new Error(`No existe el ticket #${numero} en esta caja`);
      if (venta.anulada) throw new Error(`El ticket #${numero} ya está anulado`);
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

  if (pidiendoPin) {
    return (
      <PedirPin
        titulo="¿Quién autoriza la anulación?"
        roles={ROLES_ANULAN}
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
      <div className={estilos.pantalla}>
        <Tarjeta className={estilos.tarjeta}>
          <h1 className={estilos.titulo}>Anular venta</h1>
          <p className={estilos.monto}># {numero}</p>
          <p className={estilos.error}>
            {buscar.isError && mensaje(buscar.error, "No se pudo buscar el ticket")}
          </p>
          <TecladoNumerico onDigito={teclear} onBorrar={borrar} />
          <div className={estilos.acciones}>
            <Boton variante="secundario" onClick={onVolver}>
              Cancelar
            </Boton>
            <Boton
              variante="primario"
              disabled={numero === 0 || buscar.isPending}
              onClick={() => buscar.mutate()}
            >
              {buscar.isPending ? "Buscando" : "Buscar"}
            </Boton>
          </div>
        </Tarjeta>
      </div>
    );
  }

  // Etapa 2: comparar con el ticket físico, elegir motivo y anular
  return (
    <div className={estilos.pantalla}>
      <Tarjeta className={estilos.tarjeta}>
        <h1 className={estilos.titulo}>Anular ticket #{venta.numero}</h1>

        <div className={estilos.detalle}>
          <p>
            {horaLocal(new Date(venta.ocurridaEn))} hs · {venta.medioPago}
          </p>
          <ul className={estilos.items}>
            {venta.items.map((item, i) => (
              <li key={i}>
                {item.cantidad} x {item.nombre}
              </li>
            ))}
          </ul>
          <p className={estilos.total}>
            TOTAL $ {venta.total.toLocaleString("es-AR")}
          </p>
        </div>

        <div className={estilos.motivos}>
          {MOTIVOS_ANULACION.map((elem) => (
            <Boton
              key={elem}
              variante={motivo === elem ? "primario" : "secundario"}
              onClick={() => {
                setMotivo(elem);
                anular.reset();
              }}
            >
              {elem}
            </Boton>
          ))}
        </div>

        <p className={estilos.error}>
          {anular.isError && mensaje(anular.error, "No se pudo anular la venta")}
        </p>

        <div className={estilos.acciones}>
          <Boton
            variante="secundario"
            disabled={anular.isPending}
            onClick={otroTicket}
          >
            Otro ticket
          </Boton>
          <Boton
            variante="primario"
            disabled={!motivo || anular.isPending}
            onClick={() => setPidiendoPin(true)}
          >
            {anular.isPending ? "Anulando" : "Anular"}
          </Boton>
        </div>
      </Tarjeta>
    </div>
  );
};
