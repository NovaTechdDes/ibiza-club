import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mensajeDeError, useApiAdmin } from "../api";
import { useSesionAdmin } from "../sesion";
import { FormEvent, useState } from "react";
import {
  LARGO_PIN,
  Rol,
  ROLES,
  UsuarioInput,
  UsuarioInputSchema,
  UsuarioListado,
  UsuarioUpdate,
  UsuarioUpdateSchema,
} from "@ibiza/shared";
import { NOMBRE_ROL } from "../secciones";
import { CLAVE_USUARIOS } from "./useUsuarios";
import { CampoTexto } from "../../componentes/CampoTexto";
import estilos from "../catalogo/Catalogo.module.css";
import { CampoSelect } from "../../componentes/CampoSelect";
import { Boton } from "../../componentes/Boton";

type Props = {
  usuario: UsuarioListado | null;
  onListo: () => void;
};

export function FormularioUsuario({ usuario, onListo }: Props) {
  const { api } = useApiAdmin();
  const queryClient = useQueryClient();
  const yo = useSesionAdmin((s) => s.usuario);

  const [nombre, setNombre] = useState(usuario?.nombre ?? "");
  const [rol, setRol] = useState<Rol>(usuario?.rol ?? "CAJERO");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const esAlta = usuario === null;
  const soyYo = usuario !== null && usuario.id === yo?.id;

  const datos = esAlta
    ? UsuarioInputSchema.safeParse({ nombre, rol, pin })
    : UsuarioUpdateSchema.safeParse({ nombre, rol });

  const pierdeAcceso =
    usuario !== null && rol === "CAJERO" && usuario.accesoPanel !== null;

  const opcionesRol = ROLES.map((r) => ({ valor: r, texto: NOMBRE_ROL[r] }));

  function limpiar() {
    setNombre("");
    setRol("CAJERO");
    setPin("");
  }

  const guardar = useMutation({
    mutationFn: async (input: UsuarioInput | UsuarioUpdate) =>
      usuario === null
        ? (await api.post<UsuarioListado>("/usuarios", input)).data
        : (await api.patch<UsuarioListado>(`/usuarios/${usuario.id}`, input))
            .data,
    onMutate: () => setError(null),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CLAVE_USUARIOS });
      limpiar();
      onListo();
    },
    onError: (e) =>
      setError(mensajeDeError(e, "No se pudo guardar el usuario")),
  });

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!datos.success) return;
    guardar.mutate(datos.data);
  }

  return (
    <>
      <form className={estilos.formulario} onSubmit={enviar}>
        <CampoTexto
          etiqueta={esAlta ? "Nuevo usuario" : "Editando usuario"}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={estilos.campoLargo}
        />
        <CampoSelect
          etiqueta="Rol"
          opciones={opcionesRol}
          value={rol}
          disabled={soyYo}
          title={soyYo ? "No podés cambiar tu propio rol" : undefined}
          // Seguro: las opciones salen de ROLES, no puede venir otro valor.
          onChange={(e) => setRol(e.target.value as Rol)}
        />
        {esAlta && (
          <CampoTexto
            etiqueta={`PIN (${LARGO_PIN} números)`}
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={LARGO_PIN}
            value={pin}
            // Borra todo lo que no sea dígito: si pegan "12a4" queda "124".
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className={estilos.campoCorto}
          />
        )}
        <Boton type="submit" disabled={!datos.success || guardar.isPending}>
          {guardar.isPending ? "Guardando…" : esAlta ? "Agregar" : "Guardar"}
        </Boton>
        {!esAlta && (
          <Boton variante="secundario" onClick={onListo}>
            Cancelar
          </Boton>
        )}
      </form>

      {pierdeAcceso && (
        <p className={estilos.ayuda}>
          Al pasar a Cajero pierde el acceso a la administración.
        </p>
      )}
      {error && (
        <p className={estilos.error} role="alert">
          {error}
        </p>
      )}
    </>
  );
}
