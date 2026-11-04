import { LARGO_PIN, Rol } from "@ibiza/shared";
import { Usuario, verificarPin } from "../db/usuario";
import { useUsuarios } from "../hooks/useUsuarios";
import { Boton, Tarjeta, TecladoNumerico } from "@ibiza/ui";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import estilos from "./PedirPin.module.css";

type Props = {
  titulo: string;
  roles?: Rol[];
  onCorrecto: (usuario: Usuario) => void;
  onCancelar?: () => void;
};
type Intento = { usuario: Usuario; pin: string };
export const PedirPin = ({ titulo, roles, onCorrecto, onCancelar }: Props) => {
  const { data: usuarios, isPending, isError } = useUsuarios();

  const [elegido, setElegido] = useState<Usuario | null>(null);
  const [pin, setPin] = useState("");

  const usuariosFiltrados = roles
    ? usuarios?.filter((elem) => roles.includes(elem.rol))
    : usuarios;

  const verificar = useMutation({
    mutationFn: ({ usuario, pin }: Intento) => verificarPin(usuario.id, pin),
    onSuccess: (correcto, { usuario }) => {
      if (correcto) onCorrecto(usuario);
    },
    // Acierte o no, el PIN no queda en memoria
    onSettled: () => setPin(""),
  });

  if (!elegido) {
    return (
      <div className={estilos.pantalla}>
        <Tarjeta className={estilos.tarjeta}>
          <h1 className={estilos.titulo}>{titulo}</h1>

          {isPending && <p className={estilos.aviso}>Cargando usuarios...</p>}
          {isError && (
            <p className={estilos.error}>No se pudieron leer los usuarios.</p>
          )}
          {usuariosFiltrados?.length === 0 && (
            <p className={estilos.aviso}>
              Todavía no hay usuarios en esta caja. La primera vez hace falta
              internet para bajarlos.
            </p>
          )}

          <div className={estilos.usuarios}>
            {usuariosFiltrados?.map((usuario) => (
              <Boton
                key={usuario.id}
                variante="secundario"
                onClick={() => setElegido(usuario)}
              >
                {usuario.nombre}
              </Boton>
            ))}
            {onCancelar && (
              <Boton
                variante="secundario"
                className={estilos.volver}
                onClick={onCancelar}
              >
                Volver
              </Boton>
            )}
          </div>
        </Tarjeta>
      </div>
    );
  }

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
};
