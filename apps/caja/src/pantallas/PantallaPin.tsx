import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { LARGO_PIN } from "@ibiza/shared";
import { Boton, TecladoNumerico, Tarjeta } from "@ibiza/ui";

import { verificarPin, type Usuario } from "../db/usuario";
import { useUsuarios } from "../hooks/useUsuarios";
import { useSesion } from "../stores/sesion";

import estilos from "./PantallaPin.module.css";

type Intento = { usuario: Usuario; pin: string };

export function PantallaPin() {
  const { data: usuarios, isPending, isError } = useUsuarios();
  const entrar = useSesion((estado) => estado.entrar);

  const [elegido, setElegido] = useState<Usuario | null>(null);
  const [pin, setPin] = useState("");

  const verificar = useMutation({
    mutationFn: ({ usuario, pin }: Intento) => verificarPin(usuario.id, pin),
    onSuccess: (correcto, { usuario }) => {
      if (correcto) entrar(usuario);
    },
    // Acierte o no, el PIN no queda en memoria
    onSettled: () => setPin(""),
  });

  function teclear(digito: string) {
    if (!elegido || verificar.isPending || pin.length >= LARGO_PIN) return;

    verificar.reset(); // Al volver a teclear se va el error del intento anterior

    const nuevoPin = pin + digito;
    setPin(nuevoPin);

    // Se verifica acá y no en un useEffect: una sola vez por cada PIN completo
    if (nuevoPin.length === LARGO_PIN) {
      verificar.mutate({ usuario: elegido, pin: nuevoPin });
    }
  }

  function borrar() {
    if (verificar.isPending) return;
    verificar.reset();
    setPin((actual) => actual.slice(0, -1));
  }

  function volver() {
    verificar.reset();
    setPin("");
    setElegido(null);
  }

  if (!elegido) {
    return (
      <div className={estilos.pantalla}>
        <Tarjeta className={estilos.tarjeta}>
          <h1 className={estilos.titulo}>¿Quién sos?</h1>

          {isPending && <p className={estilos.aviso}>Cargando usuarios...</p>}
          {isError && (
            <p className={estilos.error}>No se pudieron leer los usuarios.</p>
          )}
          {usuarios?.length === 0 && (
            <p className={estilos.aviso}>
              Todavía no hay usuarios en esta caja. La primera vez hace falta
              internet para bajarlos.
            </p>
          )}

          <div className={estilos.usuarios}>
            {usuarios?.map((usuario) => (
              <Boton
                key={usuario.id}
                variante="secundario"
                onClick={() => setElegido(usuario)}
              >
                {usuario.nombre}
              </Boton>
            ))}
          </div>
        </Tarjeta>
      </div>
    );
  }

  return (
    <div className={estilos.pantalla}>
      <Tarjeta className={estilos.tarjeta}>
        <h1 className={estilos.titulo}>{elegido.nombre}</h1>

        <div
          className={estilos.puntos}
          role="img"
          aria-label={`${pin.length} de ${LARGO_PIN} dígitos`}
        >
          {Array.from({ length: LARGO_PIN }, (_, indice) => (
            <span
              key={indice}
              className={`${estilos.punto} ${indice < pin.length ? estilos.puntoLleno : ""}`}
            />
          ))}
        </div>

        {/* Siempre ocupa su lugar: así el teclado no se mueve bajo el dedo */}
        <p className={estilos.error}>
          {verificar.data === false && "PIN incorrecto"}
          {verificar.isError && "No se pudo verificar el PIN"}
        </p>

        <TecladoNumerico onDigito={teclear} onBorrar={borrar} />

        <Boton
          variante="secundario"
          className={estilos.volver}
          disabled={verificar.isPending}
          onClick={volver}
        >
          Volver
        </Boton>
      </Tarjeta>
    </div>
  );
}
