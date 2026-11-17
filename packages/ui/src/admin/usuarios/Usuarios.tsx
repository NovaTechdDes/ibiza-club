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
import { CambiarPin } from "./CambiarPin";
import { AccesoPanel } from "./AccesoPanel";

export const Usuarios = () => {
  const [editando, setEditando] = useState<UsuarioListado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gestion, setGestion] = useState<{
    usuario: UsuarioListado;
    que: "pin" | "acceso";
  } | null>(null);

  const { api } = useApiAdmin();
  const queryClient = useQueryClient();
  const usuarios = useUsuarios();
  const yo = useSesionAdmin((s) => s.usuario);

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

      {gestion?.que === "pin" && (
        <CambiarPin
          key={gestion.usuario.id}
          usuario={gestion.usuario}
          onListo={() => setGestion(null)}
        />
      )}

      {gestion?.que === "acceso" && (
        <AccesoPanel
          onListo={() => setGestion(null)}
          key={gestion.usuario.id}
          usuario={gestion.usuario}
        />
      )}

      {error && (
        <p className={estilos.error} role="alert">
          {error}
        </p>
      )}

      {usuarios.isPending && <p className={estilos.ayuda}>Cargando…</p>}
      {usuarios.isError && (
        <p className={estilos.error}>
          {mensajeDeError(
            usuarios.error,
            "No se pudieron cargar los usuarios.",
          )}
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
                <span className={estilos.etiqueta}>
                  {NOMBRE_ROL[usuario.rol]}
                </span>
                {usuario.accesoPanel && (
                  <span className={estilos.ayuda}>
                    Panel: {usuario.accesoPanel.email}
                  </span>
                )}
                {!usuario.activo && (
                  <span className={estilos.etiqueta}>Dado de baja</span>
                )}

                <div className={estilos.acciones}>
                  <Boton
                    variante="secundario"
                    onClick={() => {
                      setEditando(usuario);
                      setGestion(null);
                    }}
                  >
                    Editar
                  </Boton>
                  <Boton
                    variante="secundario"
                    onClick={() => {
                      setGestion({ usuario, que: "pin" });
                      setEditando(null);
                    }}
                  >
                    Cambiar PIN
                  </Boton>
                  {usuario.rol !== "CAJERO" && (
                    <Boton
                      variante="secundario"
                      onClick={() => {
                        setGestion({ usuario, que: "acceso" });
                        setEditando(null);
                      }}
                    >
                      Acceso al panel
                    </Boton>
                  )}
                  <Boton
                    variante={usuario.activo ? "peligro" : "secundario"}
                    disabled={soyYo || cambiarEstado.isPending}
                    title={
                      soyYo ? "No podés darte de baja a vos mismo" : undefined
                    }
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
