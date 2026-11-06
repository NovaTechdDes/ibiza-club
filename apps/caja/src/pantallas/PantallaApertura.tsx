import type { Rol } from "@ibiza/shared";
import type { Usuario } from "../db/usuario";

import { leerConfigCaja } from "../db/ajustes";
import { calcularJornada } from "../lib/jornada";
import { crearApertura } from "../db/apertura";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSesion } from "../stores/sesion";
import { useState } from "react";
import { CLAVE_APERTURA } from "../hooks/useApertura";
import { Boton, Tarjeta, TecladoNumerico } from "@ibiza/ui";

import estilos from "./PantallaApertura.module.css";
import { PedirPin } from "../componentes/PedirPin";
import { avisarOperacionNueva } from "../hooks/useSubida";

const ROLES_AUTORIZAN: Rol[] = ["ENCARGADO", "ADMIN"];
const FONDO_MAXIMO = 99_999_999;

// La config se lee aca y no con usequery: la clave no tiene que quedar en el cache
const abrirCaja = async (
  cajeroId: number,
  encargadoId: number,
  fondo: number,
) => {
  const config = await leerConfigCaja();
  if (!config) throw new Error("Falta la primera sincronización con la nube");

  const jornada = config.jornadaActiva
    ? await calcularJornada(new Date(), config.claveLetra)
    : null;
  await crearApertura({ cajeroId, encargadoId, fondo, jornada });
};

export function PantallaApertura({ cajero }: { cajero: Usuario }) {
  const queryClient = useQueryClient();
  const salir = useSesion((estado) => estado.salir);

  const [fondo, setFondo] = useState(0);
  const [pidiendoPin, setPidiendoPin] = useState(false);

  const abrir = useMutation({
    mutationFn: (encargado: Usuario) =>
      abrirCaja(cajero.id, encargado.id, fondo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLAVE_APERTURA });
      avisarOperacionNueva(queryClient);
    },
  });

  function teclear(digito: string) {
    abrir.reset();
    setFondo((actual) => {
      const nuevo = actual * 10 + Number(digito);
      return nuevo > FONDO_MAXIMO ? actual : nuevo;
    });
  }

  function borrar() {
    abrir.reset();
    setFondo((actual) => Math.floor(actual / 10));
  }

  if (pidiendoPin) {
    return (
      <PedirPin
        titulo="¿Quién autoriza?"
        roles={ROLES_AUTORIZAN}
        onCancelar={() => setPidiendoPin(false)}
        onCorrecto={(encargado) => {
          setPidiendoPin(false);
          abrir.mutate(encargado);
        }}
      />
    );
  }

  return (
    <div className={estilos.pantalla}>
      <Tarjeta className={estilos.tarjeta}>
        <h1 className={estilos.titulo}>Fondo de cambio</h1>
        <p className={estilos.monto}>$ {fondo.toLocaleString("es-AR")}</p>

        {/* Siempre ocupa su lugar: asi e teclado no se mueve bajo el dedo */}
        <p className={estilos.error}>
          {abrir.isError &&
            (abrir.error instanceof Error
              ? abrir.error.message
              : "No se pudo abrir la caja")}
        </p>

        <TecladoNumerico onDigito={teclear} onBorrar={borrar} />

        <div className={estilos.acciones}>
          <Boton
            variante="secundario"
            disabled={abrir.isPending}
            onClick={salir}
          >
            Salir
          </Boton>
          <Boton
            disabled={abrir.isPending}
            onClick={() => setPidiendoPin(true)}
          >
            {abrir.isPending ? "Abriendo..." : "Abrir Caja"}
          </Boton>
        </div>
      </Tarjeta>
    </div>
  );
}
