import type { UsuarioListado } from "@ibiza/shared";
import { useState } from "react";
import { FormularioUsuario } from "./FormularioUsuario";
import { mensajeDeError, useApiAdmin } from "../api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CLAVE_USUARIOS, useUsuarios } from "./useUsuarios";
import { useSesionAdmin } from "../sesion";
import { NOMBRE_ROL } from "../secciones";
import { Boton } from "../../componentes/Boton";
import estilos from "../catalogo/Catalogo.module.css";

export const Usuarios = () => {
  const [editando, setEditando] = useState<UsuarioListado | null>(null);
  const { api } = useApiAdmin();
  const queryClient = useQueryClient();
  const usuarios = useUsuarios();
  const yo = useSesionAdmin((s) => s.usuario);
  const [error, setError] = useState<string | null>(null);

  const cambiarEstado = useMutation({
    mutationFn: async (usuario: UsuarioListado) =>
      (
        await api.post<UsuarioListado>(
          `/usuarios/${usuario.id}/${usuario.activo ? "baja" : "alta"}`,
        )
      ).data,
    onMutate: () => setError(null),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: CLAVE_USUARIOS }),
    onError: (e) =>
      setError(mensajeDeError(e, "No se pudo cambiar el estado.")),
  });

  return (
    <div className={estilos.pantalla}>
      <FormularioUsuario
        key={editando?.id ?? "nuevo"}
        usuario={editando}
        onListo={() => setEditando(null)}
      />

      {error && (
        <p className={estilos.error} role="alert">
          {error}
        </p>
      )}

      {usuarios.isPending && <p className={estilos.ayuda}>Cargando…</p>}
      {usuarios.isError && (
        <p className={estilos.error}>
          {mensajeDeError(usuarios.error, "No se pudieron cargar los usuarios.")}
        </p>
      )}
      {usuarios.data?.length === 0 && (
        <p className={estilos.ayuda}>Todavía no hay usuarios.</p>
      )}

      {usuarios.data && usuarios.data.length > 0 && (
        <ul className={estilos.lista}>
          {usuarios.data.map((usuario) => {
            // La API rechaza que un admin se dé de baja a sí mismo: ni lo ofrecemos.
            const soyYo = usuario.id === yo?.id;

            return (
              <li
                key={usuario.id}
                className={`${estilos.fila} ${usuario.activo ? "" : estilos.inactiva}`}
              >
                <strong className={estilos.nombre}>
                  {usuario.nombre}
                  {soyYo && " (vos)"}
                </strong>
                <span className={estilos.etiqueta}>{NOMBRE_ROL[usuario.rol]}</span>
                {usuario.accesoPanel && (
                  <span className={estilos.ayuda}>
                    Panel: {usuario.accesoPanel.email}
                  </span>
                )}
                {!usuario.activo && (
                  <span className={estilos.etiqueta}>Dado de baja</span>
                )}

                <div className={estilos.acciones}>
                  <Boton variante="secundario" onClick={() => setEditando(usuario)}>
                    Editar
                  </Boton>
                  <Boton
                    variante={usuario.activo ? "peligro" : "secundario"}
                    disabled={soyYo || cambiarEstado.isPending}
                    title={soyYo ? "No podés darte de baja a vos mismo" : undefined}
                    onClick={() => cambiarEstado.mutate(usuario)}
                  >
                    {usuario.activo ? "Dar de baja" : "Reactivar"}
                  </Boton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
