import { Boton, Tarjeta, TecladoNumerico } from "@ibiza/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useApertura } from "../hooks/useApertura";
import { useSesion } from "../stores/sesion";
import { registrarMovimiento } from "../db/movimiento";
import { avisarOperacionNueva } from "../hooks/useSubida";

import estilos from "./PantallaRetiro.module.css";
import type { Usuario } from "../db/usuario";
import { PedirPin } from "../componentes/PedirPin";
import type { Rol } from "@ibiza/shared";

interface Props {
  onVolver: () => void;
}

const ROLES_AUTORIZAN: Rol[] = ["ENCARGADO", "ADMIN"];
const MONTO_MAXIMO = 99_999_999;
const MOTIVOS_RETIRO = [
  "Exceso de efectivo",
  "Pago a proveedor",
  "Cambio para otra caja",
  "Otro",
];

export const PantallaRetiro = ({ onVolver }: Props) => {
  const queryClient = useQueryClient();

  const [monto, setMonto] = useState<number>(0);
  const [motivo, setMotivo] = useState<string | null>(null);
  const [pidiendoPin, setPidiendoPin] = useState<boolean>(false);

  const { data: apertura } = useApertura();
  const usuario = useSesion((estado) => estado.usuario);

  const retirar = useMutation({
    mutationFn: (encargado: Usuario) => {
      if (!apertura || !usuario) throw new Error("Falta Apertura o el cajero");

      return registrarMovimiento({
        tipo: "RETIRO",
        aperturaId: apertura.id,
        monto: monto,
        usuarioId: usuario.id,
        autorizoId: encargado.id,
        motivo: motivo,
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

  return (
    <div className={estilos.pantalla}>
      <Tarjeta className={estilos.tarjeta}>
        <h1 className={estilos.titulo}>Retiro</h1>
        <p className={estilos.monto}>$ {monto.toLocaleString("es-AR")}</p>
        <p className={estilos.error}>
          {retirar.isError &&
            (retirar.error instanceof Error
              ? retirar.error.message
              : "No se pudo retirar de la caja")}
        </p>
        <TecladoNumerico onDigito={teclear} onBorrar={borrar} />
        <div className={estilos.motivos}>
          {MOTIVOS_RETIRO.map((elem) => (
            <Boton
              onClick={() => {
                setMotivo(elem);
                retirar.reset();
              }}
              key={elem}
              variante={motivo === elem ? "primario" : "secundario"}
            >
              {elem}
            </Boton>
          ))}
        </div>

        <div className={estilos.acciones}>
          <Boton
            variante="secundario"
            disabled={retirar.isPending}
            onClick={onVolver}
          >
            Cancelar
          </Boton>
          <Boton
            variante="primario"
            disabled={monto === 0 || !motivo || retirar.isPending}
            onClick={() => setPidiendoPin(true)}
          >
            {retirar.isPending ? "Retirando" : "Retirar"}
          </Boton>
        </div>
      </Tarjeta>
    </div>
  );
};
