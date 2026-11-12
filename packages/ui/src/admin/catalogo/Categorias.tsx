import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mensajeDeError, useApiAdmin } from "../api";
import { useSesionAdmin } from "../sesion";
import { type FormEvent, useState } from "react";
import {
  type Categoria,
  type CategoriaInput,
  CategoriaInputSchema,
} from "@ibiza/shared";
import { Boton } from "../../componentes/Boton";
import { CampoTexto } from "../../componentes/CampoTexto";

import estilos from "./Catalogo.module.css";

export const CLAVE_CATEGORIAS = ["admin", "categorias"] as const;

type Formulario = { id: number | null; nombre: string; orden: string };
const VACIO: Formulario = { id: null, nombre: "", orden: "" };

export function Categorias() {
  const { api } = useApiAdmin();
  const queryClient = useQueryClient();

  const esAdmin = useSesionAdmin((estado) => estado.usuario?.rol === "ADMIN");

  const [form, setForm] = useState<Formulario>(VACIO);
  const [error, setError] = useState<string | null>(null);

  const categorias = useQuery({
    queryKey: CLAVE_CATEGORIAS,
    queryFn: async () => (await api.get<Categoria[]>("/categorias")).data,
  });

  const refrescar = () =>
    queryClient.invalidateQueries({ queryKey: CLAVE_CATEGORIAS });

  const datos = CategoriaInputSchema.safeParse({
    nombre: form.nombre,
    orden: form.orden.trim() === "" ? undefined : Number(form.orden),
  });

  const guardar = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: number | null;
      input: CategoriaInput;
    }) =>
      id === null
        ? (await api.post<Categoria>("/categorias", input)).data
        : (await api.patch<Categoria>(`/categorias/${id}`, input)).data,
    onMutate: () => setError(null),
    onSuccess: () => {
      setForm(VACIO);
      return refrescar();
    },
    onError: (e) =>
      setError(mensajeDeError(e, "No se pudo guardar la categoria.")),
  });

  const cambiarEstado = useMutation({
    mutationFn: async (categoria: Categoria) =>
      (
        await api.post<Categoria>(
          `/categorias/${categoria.id}/${categoria.activo ? "baja" : "alta"}`,
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

  function editar(categoria: Categoria) {
    setError(null);
    setForm({
      id: categoria.id,
      nombre: categoria.nombre,
      orden: String(categoria.orden),
    });
  }

  const editando = form.id !== null;
  return (
    <div className={estilos.pantalla}>
      {esAdmin ? (
        <form className={estilos.formulario} onSubmit={enviar}>
          <CampoTexto
            etiqueta={editando ? "Editando categoría" : "Nueva categoría"}
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
          Solo el administrador crea o cambia categorías.
        </p>
      )}

      {error && (
        <p className={estilos.error} role="alert">
          {error}
        </p>
      )}

      {categorias.isPending && <p className={estilos.ayuda}>Cargando…</p>}
      {categorias.isError && (
        <p className={estilos.error}>
          {mensajeDeError(
            categorias.error,
            "No se pudieron cargar las categorías.",
          )}
        </p>
      )}
      {categorias.data?.length === 0 && (
        <p className={estilos.ayuda}>Todavía no hay categorías.</p>
      )}

      {categorias.data && categorias.data.length > 0 && (
        <ul className={estilos.lista}>
          {categorias.data.map((categoria) => (
            <li
              key={categoria.id}
              className={`${estilos.fila} ${categoria.activo ? "" : estilos.inactiva}`}
            >
              <span className={estilos.orden}>{categoria.orden}</span>
              <strong className={estilos.nombre}>{categoria.nombre}</strong>
              {!categoria.activo && (
                <span className={estilos.etiqueta}>Dada de baja</span>
              )}
              {esAdmin && (
                <div className={estilos.acciones}>
                  <Boton
                    variante="secundario"
                    onClick={() => editar(categoria)}
                  >
                    Editar
                  </Boton>
                  <Boton
                    variante={categoria.activo ? "peligro" : "secundario"}
                    disabled={cambiarEstado.isPending}
                    onClick={() => cambiarEstado.mutate(categoria)}
                  >
                    {categoria.activo ? "Dar de baja" : "Reactivar"}
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
