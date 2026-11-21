import { LARGO_PIN, Rol } from "@ibiza/shared";
import { Usuario, verificarPin } from "../db/usuario";
import { useUsuarios } from "../hooks/useUsuarios";
import { Boton, TecladoNumerico } from "@ibiza/ui";
import { useMutation } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Acciones, Dialogo, Mensaje } from "./Dialogo";
import estilos from "./PedirPin.module.css";

type Props = {
  titulo: string;
  roles?: Rol[];
  // Se dibuja arriba del diálogo (el logo en la entrada del cajero)
  encabezado?: ReactNode;
  onCorrecto: (usuario: Usuario) => void;
  onCancelar?: () => void;
};
type Intento = { usuario: Usuario; pin: string };
export const PedirPin = ({ titulo, roles, encabezado, onCorrecto, onCancelar }: Props) => {
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
      <Dialogo titulo={titulo} ayuda="Tocá tu nombre" encabezado={encabezado}>
        {isPending && <Mensaje tipo="aviso">Cargando usuarios...</Mensaje>}
        {isError && <Mensaje>No se pudieron leer los usuarios.</Mensaje>}
        {usuariosFiltrados?.length === 0 && (
          <Mensaje tipo="aviso">
            Todavía no hay usuarios en esta caja. La primera vez hace falta
            internet para bajarlos.
          </Mensaje>
        )}

        <div className={estilos.usuarios}>
          {usuariosFiltrados?.map((usuario) => (
            <button
              key={usuario.id}
              type="button"
              className={estilos.usuario}
              onClick={() => setElegido(usuario)}
            >
              <span className={estilos.inicial} aria-hidden="true">
                {usuario.nombre.charAt(0)}
              </span>
              <span className={estilos.nombre}>{usuario.nombre}</span>
            </button>
          ))}
        </div>

        {onCancelar && (
          <Acciones>
            <Boton variante="secundario" onClick={onCancelar}>
              Volver
            </Boton>
          </Acciones>
        )}
      </Dialogo>
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
    <Dialogo titulo={elegido.nombre} ayuda="Ingresá tu PIN" encabezado={encabezado}>
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

      <Mensaje>
        {verificar.data === false && "PIN incorrecto"}
        {verificar.isError && "No se pudo verificar el PIN"}
      </Mensaje>

      <TecladoNumerico onDigito={teclear} onBorrar={borrar} />

      <Acciones>
        <Boton
          variante="secundario"
          disabled={verificar.isPending}
          onClick={volver}
        >
          Volver
        </Boton>
      </Acciones>
    </Dialogo>
  );
};
