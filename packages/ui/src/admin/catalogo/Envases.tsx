import { type FormEvent, useState } from "react";
import { Boton } from "../../componentes/Boton";
import { CampoTexto } from "../../componentes/CampoTexto";

import estilos from "./Catalogo.module.css";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mensajeDeError, useApiAdmin } from "../api";
import { useSesionAdmin } from "../sesion";
import {
  type Envase,
  type EnvaseInput,
  EnvaseInputSchema,
} from "@ibiza/shared";

export const CLAVE_ENVASES = ["admin", "envases"] as const;

type Formulario = { id: number | null; nombre: string; orden: string };
const VACIO: Formulario = { id: null, nombre: "", orden: "" };

export function Envases() {
  const { api } = useApiAdmin();
  const queryClient = useQueryClient();

  const esAdmin = useSesionAdmin((estado) => estado.usuario?.rol === "ADMIN");

  const [form, setForm] = useState<Formulario>(VACIO);
  const [error, setError] = useState<string | null>(null);

  const envases = useQuery({
    queryKey: CLAVE_ENVASES,
    queryFn: async () => (await api.get<Envase[]>("/envases")).data,
  });

  const refrescar = () =>
    queryClient.invalidateQueries({ queryKey: CLAVE_ENVASES });

  const datos = EnvaseInputSchema.safeParse({
    nombre: form.nombre,
    orden: form.orden.trim() === "" ? undefined : Number(form.orden),
  });

  const guardar = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: number | null;
      input: EnvaseInput;
    }) =>
      id === null
        ? (await api.post<Envase>("/envases", input)).data
        : (await api.patch<Envase>(`/envases/${id}`, input)).data,
    onMutate: () => setError(null),
    onSuccess: () => {
      setForm(VACIO);
      return refrescar();
    },
    onError: (e) =>
      setError(mensajeDeError(e, "No se pudo guardar el envase.")),
  });

  const cambiarEstado = useMutation({
    mutationFn: async (envase: Envase) =>
      (
        await api.post<Envase>(
          `/envases/${envase.id}/${envase.activo ? "baja" : "alta"}`,
        )
      ).data,
    onMutate: () => setError(null),
    onSuccess: () => refrescar(),
    onError: (e) =>
      setError(mensajeDeError(e, "No se pudo cambiar el estado.")),
  });

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!datos.success) return;
    guardar.mutate({ id: form.id, input: datos.data });
  }

  function editar(envase: Envase) {
    setError(null);
    setForm({
      id: envase.id,
      nombre: envase.nombre,
      orden: String(envase.orden),
    });
  }

  const editando = form.id !== null;

  return (
    <div className={estilos.pantalla}>
      {esAdmin ? (
        <form className={estilos.formulario} onSubmit={enviar}>
          <CampoTexto
            etiqueta={editando ? "Editando envase" : "Nuevo envase"}
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className={estilos.campoLargo}
          />
          <CampoTexto
            etiqueta="Orden"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={form.orden}
            onChange={(e) => setForm({ ...form, orden: e.target.value })}
            className={estilos.campoCorto}
          />
          <Boton type="submit" disabled={!datos.success || guardar.isPending}>
            {guardar.isPending
              ? "Guardando…"
              : editando
                ? "Guardar"
                : "Agregar"}
          </Boton>
          {editando && (
            <Boton variante="secundario" onClick={() => setForm(VACIO)}>
              Cancelar
            </Boton>
          )}
        </form>
      ) : (
        <p className={estilos.ayuda}>
          Solo el administrador crea o cambia envases.
        </p>
      )}

      {error && (
        <p className={estilos.error} role="alert">
          {error}
        </p>
      )}

      {envases.isPending && <p className={estilos.ayuda}>Cargando…</p>}
      {envases.isError && (
        <p className={estilos.error}>
          {mensajeDeError(envases.error, "No se pudieron cargar los envases.")}
        </p>
      )}
      {envases.data?.length === 0 && (
        <p className={estilos.ayuda}>Todavía no hay envases.</p>
      )}

      {envases.data && envases.data.length > 0 && (
        <ul className={estilos.lista}>
          {envases.data.map((envase) => (
            <li
              key={envase.id}
              className={`${estilos.fila} ${envase.activo ? "" : estilos.inactiva}`}
            >
              <span className={estilos.orden}>{envase.orden}</span>
              <strong className={estilos.nombre}>{envase.nombre}</strong>
              {!envase.activo && (
                <span className={estilos.etiqueta}>Dado de baja</span>
              )}
              {esAdmin && (
                <div className={estilos.acciones}>
                  <Boton variante="secundario" onClick={() => editar(envase)}>
                    Editar
                  </Boton>
                  <Boton
                    variante={envase.activo ? "peligro" : "secundario"}
                    disabled={cambiarEstado.isPending}
                    onClick={() => cambiarEstado.mutate(envase)}
                  >
                    {envase.activo ? "Dar de baja" : "Reactivar"}
                  </Boton>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
