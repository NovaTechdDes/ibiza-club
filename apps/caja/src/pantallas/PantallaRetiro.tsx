import { Boton, TecladoNumerico } from "@ibiza/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useApertura } from "../hooks/useApertura";
import { useSesion } from "../stores/sesion";
import { registrarMovimiento } from "../db/movimiento";
import { avisarOperacionNueva } from "../hooks/useSubida";

import estilos from "./PantallaRetiro.module.css";
import type { Usuario } from "../db/usuario";
import { PedirPin } from "../componentes/PedirPin";
import {
  Acciones,
  Cifra,
  Dialogo,
  Mensaje,
  Opciones,
} from "../componentes/Dialogo";
import { fechaOperativa, horaLocal } from "@ibiza/shared";
import {
  imprimirConReintento,
  imprimirRetiro,
  type Retiro,
} from "../lib/impresora";
import { useVinculacion } from "../hooks/useVinculacion";
import { useImpresora } from "../hooks/useImpresora";
import { fechaTicket } from "../lib/ticket";
import { puedeAutorizar, ROLES_AUTORIZAN } from "../lib/autorizacion";
import { confirmar } from "../lib/alertas";

interface Props {
  onVolver: () => void;
}

const MONTO_MAXIMO = 99_999_999;
const MOTIVOS_RETIRO = [
  "Exceso de efectivo",
  "Pago a proveedor",
  "Cambio para otra caja",
  "Otro",
];

export const PantallaRetiro = ({ onVolver }: Props) => {
  const queryClient = useQueryClient();

  const { data: vinculacion } = useVinculacion();
  const { data: config } = useImpresora();

  const [monto, setMonto] = useState<number>(0);
  const [motivo, setMotivo] = useState<string | null>(null);
  const [pidiendoPin, setPidiendoPin] = useState<boolean>(false);

  const { data: apertura } = useApertura();
  const usuario = useSesion((estado) => estado.usuario);

  const retirar = useMutation({
    mutationFn: async (encargado: Usuario) => {
      if (!apertura || !usuario || !vinculacion || !motivo)
        throw new Error(
          "Falta Apertura o el cajero, la vinculacion o el motivo",
        );

      const { id, ocurridaEn } = await registrarMovimiento({
        tipo: "RETIRO",
        aperturaId: apertura.id,
        monto: monto,
        usuarioId: usuario.id,
        autorizoId: encargado.id,
        motivo: motivo,
      });

      const instante = new Date(ocurridaEn);

      const retiro: Retiro = {
        numero: id,
        caja: vinculacion.cajaNombre,
        monto,
        motivo,
        cajero: usuario.nombre,
        autorizo: encargado.nombre,
        fecha: fechaTicket(fechaOperativa(instante, 0)),
        hora: horaLocal(instante),
      };

      return imprimirConReintento(config ?? null, {
        titulo: `No se imprimió el retiro #${id}`,
        aclaracion: `El retiro ya quedó guardado.`,
        imprimir: (c) => imprimirRetiro(c.ip, c.puerto, c.ancho, retiro),
      });
    },
    onSuccess: () => {
      avisarOperacionNueva(queryClient);
      onVolver();
    },
  });

  function teclear(digito: string) {
    retirar.reset();
    setMonto((actual) => {
      const nuevo = actual * 10 + Number(digito);
      return nuevo > MONTO_MAXIMO ? actual : nuevo;
    });
  }

  function borrar() {
    retirar.reset();
    setMonto((actual) => Math.floor(actual / 10));
  }

  async function pedirAutorizacion() {
    if (!puedeAutorizar(usuario)) {
      setPidiendoPin(true);
      return;
    }
    if (
      await confirmar(
        `¿Retirar $ ${monto.toLocaleString("es-AR")}?`,
        "Sí, retirar",
      )
    )
      retirar.mutate(usuario);
  }

  if (pidiendoPin) {
    return (
      <PedirPin
        titulo="¿Quién autoriza el retiro?"
        roles={ROLES_AUTORIZAN}
        onCancelar={() => setPidiendoPin(false)}
        onCorrecto={(encargado) => {
          setPidiendoPin(false);
          retirar.mutate(encargado);
        }}
      />
    );
  }

  // Dos columnas: a la izquierda el monto y el teclado, a la derecha el motivo y
  // los botones. En una sola columna no entraba en 768 px de alto.
  return (
    <Dialogo
      titulo="Retiro de efectivo"
      ayuda="Cargá el monto que sale de la caja y elegí el motivo."
      tamaño="grande"
    >
      <div className={estilos.columnas}>
        <div className={estilos.columna}>
          <Cifra prefijo="$">{monto.toLocaleString("es-AR")}</Cifra>
          <TecladoNumerico onDigito={teclear} onBorrar={borrar} />
        </div>

        <div className={estilos.columna}>
          <span className={estilos.etiqueta}>Motivo</span>
          <Opciones
            opciones={MOTIVOS_RETIRO}
            elegida={motivo}
            columnas={1}
            onElegir={(elegido) => {
              setMotivo(elegido);
              retirar.reset();
            }}
          />

          <Mensaje>
            {retirar.isError &&
              (retirar.error instanceof Error
                ? retirar.error.message
                : "No se pudo retirar de la caja")}
          </Mensaje>

          <Acciones className={estilos.abajo}>
            <Boton
              variante="secundario"
              disabled={retirar.isPending}
              onClick={onVolver}
            >
              Cancelar
            </Boton>
            <Boton
              disabled={monto === 0 || !motivo || retirar.isPending}
              onClick={pedirAutorizacion}
            >
              {retirar.isPending ? "Retirando..." : "Retirar"}
            </Boton>
          </Acciones>
        </div>
      </div>
    </Dialogo>
  );
};
