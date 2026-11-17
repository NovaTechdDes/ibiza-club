import {
  AccesoPanelInput,
  AccesoPanelInputSchema,
  LARGO_MIN_PASSWORD,
  UsuarioListado,
} from "@ibiza/shared";
import { mensajeDeError, useApiAdmin } from "../api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { CLAVE_USUARIOS } from "./useUsuarios";
import estilos from "../catalogo/Catalogo.module.css";
import { CampoTexto } from "../../componentes/CampoTexto";
import { Boton } from "../../componentes/Boton";
import { useSesionAdmin } from "../sesion";

type Props = {
  usuario: UsuarioListado;
  onListo: () => void;
};

export function AccesoPanel({ usuario, onListo }: Props) {
  const { api } = useApiAdmin();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState(usuario.accesoPanel?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const yo = useSesionAdmin((s) => s.usuario);
  const soyYo = usuario.id === yo?.id;
  const [confirmando, setConfirmando] = useState(false);

  const datos = AccesoPanelInputSchema.safeParse({ email, password });

  const guardar = useMutation({
    mutationFn: async (input: AccesoPanelInput) =>
      (
        await api.put<UsuarioListado>(`/usuarios/${usuario.id}/acceso`, input)
      ).data,
    onMutate: () => setError(null),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CLAVE_USUARIOS });
      onListo();
    },
    onError: (e) => setError(mensajeDeError(e, "No se pudo guardar el acceso")),
  });

  const quitar = useMutation({
    mutationFn: async () => {
      await api.delete(`/usuarios/${usuario.id}/acceso`);
    },
    onMutate: () => setError(null),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CLAVE_USUARIOS });
      onListo();
    },
    onError: (e) => setError(mensajeDeError(e, "No se pudo quitar el acceso")),
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
          etiqueta={`Email ${usuario.nombre}`}
          type="email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={estilos.campoLargo}
        />
        <CampoTexto
          etiqueta="Contraseña"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={estilos.campoLargo}
        />
        <Boton type="submit" disabled={!datos.success || guardar.isPending}>
          {guardar.isPending
            ? "Guardando…"
            : usuario.accesoPanel
              ? "Cambiar email/contraseña"
              : "Dar acceso"}
        </Boton>
        <Boton variante="secundario" onClick={onListo}>
          Cancelar
        </Boton>
        {usuario.accesoPanel !== null && (
          <Boton
            onClick={() =>
              confirmando ? quitar.mutate() : setConfirmando(true)
            }
            variante="peligro"
            disabled={soyYo || quitar.isPending}
            title={soyYo ? "No podés quitarte tu propio acceso" : undefined}
          >
            {confirmando ? "¿Seguro? Quitar" : "Quitar acceso"}
          </Boton>
        )}
      </form>

      <p className={estilos.ayuda}>
        Mínimo {LARGO_MIN_PASSWORD} caracteres.
      </p>
      {error && (
        <p className={estilos.error} role="alert">
          {error}
        </p>
      )}
    </>
  );
}
