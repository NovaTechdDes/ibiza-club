import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mensajeDeError, useApiAdmin } from "../api";
import { useSesionAdmin } from "../sesion";
import { type FormEvent, useState } from "react";
import {
  type Producto,
  type ProductoInput,
  ProductoInputSchema,
} from "@ibiza/shared";
import { Boton } from "../../componentes/Boton";
import { CampoTexto } from "../../componentes/CampoTexto";

import estilos from "./Catalogo.module.css";
import { useCategorias } from "./useCategorias";
import { CampoSelect } from "../../componentes/CampoSelect";
import { CLAVE_PRODUCTOS, useProductos } from "./useProductos";

type Formulario = {
  id: number | null;
  nombre: string;
  orden: string;
  categoriaId: string;
};
const VACIO: Formulario = { id: null, nombre: "", orden: "", categoriaId: "" };

export function Productos() {
  const { api } = useApiAdmin();
  const queryClient = useQueryClient();

  const esAdmin = useSesionAdmin((estado) => estado.usuario?.rol === "ADMIN");

  const [form, setForm] = useState<Formulario>(VACIO);
  const [error, setError] = useState<string | null>(null);

  const categorias = useCategorias();

  const productos = useProductos();

  const refrescar = () =>
    queryClient.invalidateQueries({ queryKey: CLAVE_PRODUCTOS });

  const datos = ProductoInputSchema.safeParse({
    nombre: form.nombre,
    orden: form.orden.trim() === "" ? undefined : Number(form.orden),
    categoriaId: form.categoriaId === "" ? undefined : Number(form.categoriaId),
  });

  const guardar = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: number | null;
      input: ProductoInput;
    }) =>
      id === null
        ? (await api.post<Producto>("/productos", input)).data
        : (await api.patch<Producto>(`/productos/${id}`, input)).data,
    onMutate: () => setError(null),
    onSuccess: (_producto, { input }) => {
      setForm({ ...VACIO, categoriaId: String(input.categoriaId) });
      return refrescar();
    },
    onError: (e) =>
      setError(mensajeDeError(e, "No se pudo guardar el producto.")),
  });

  const cambiarEstado = useMutation({
    mutationFn: async (producto: Producto) =>
      (
        await api.post<Producto>(
          `/productos/${producto.id}/${producto.activo ? "baja" : "alta"}`,
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

  function editar(producto: Producto) {
    setError(null);
    setForm({
      id: producto.id,
      nombre: producto.nombre,
      orden: String(producto.orden),
      categoriaId: String(producto.categoriaId),
    });
  }

  const editando = form.id !== null;

  const opcionesCategoria =
    categorias?.data
      ?.filter((elem) => elem.activo)
      .map((elem) => ({ valor: String(elem.id), texto: elem.nombre })) ?? [];

  // Un grupo por categoría, en el orden que ya trae la API. Se saltean las que no tienen productos.
  // Se calcula acá y no adentro del JSX para que el .map del render quede simple.
  const grupos = (categorias.data ?? [])
    .map((categoria) => ({
      categoria,
      productos: (productos.data ?? []).filter(
        (producto) => producto.categoriaId === categoria.id,
      ),
    }))
    .filter((grupo) => grupo.productos.length > 0);

  return (
    <div className={estilos.pantalla}>
      {esAdmin ? (
        opcionesCategoria.length === 0 ? (
          <p className={estilos.ayuda}>
            Primero creá una categoría en la pestaña Categorías.
          </p>
        ) : (
          <form className={estilos.formulario} onSubmit={enviar}>
            <CampoTexto
              etiqueta={editando ? "Editando producto" : "Nuevo producto"}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={estilos.campoLargo}
            />

            <CampoSelect
              etiqueta="Categoría"
              placeholder="Elegí una categoría"
              opciones={opcionesCategoria}
              value={form.categoriaId}
              onChange={(e) =>
                setForm({ ...form, categoriaId: e.target.value })
              }
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
        )
      ) : (
        <p className={estilos.ayuda}>
          Solo el administrador crea o cambia productos.
        </p>
      )}

      {error && (
        <p className={estilos.error} role="alert">
          {error}
        </p>
      )}

      {(productos.isPending || categorias.isPending) && (
        <p className={estilos.ayuda}>Cargando…</p>
      )}
      {(productos.isError || categorias.isError) && (
        <p className={estilos.error}>
          {mensajeDeError(
            productos.error ?? categorias.error,
            "No se pudo cargar el catálogo.",
          )}
        </p>
      )}
      {productos.data?.length === 0 && (
        <p className={estilos.ayuda}>Todavía no hay productos.</p>
      )}

      {grupos.map(({ categoria, productos: productosDelGrupo }) => (
        <section key={categoria.id} className={estilos.grupo}>
          <h3 className={estilos.tituloGrupo}>
            {categoria.nombre}
            {!categoria.activo && " · dada de baja"}
          </h3>
          <ul className={estilos.lista}>
            {productosDelGrupo.map((producto) => (
              <li
                key={producto.id}
                className={`${estilos.fila} ${producto.activo ? "" : estilos.inactiva}`}
              >
                <span className={estilos.orden}>{producto.orden}</span>
                <strong className={estilos.nombre}>{producto.nombre}</strong>
                {!producto.activo && (
                  <span className={estilos.etiqueta}>Dado de baja</span>
                )}
                {esAdmin && (
                  <div className={estilos.acciones}>
                    {/* Solo activos: uno dado de baja puede estar en una categoría inactiva y el PATCH fallaría. */}
                    {producto.activo && (
                      <Boton
                        variante="secundario"
                        onClick={() => editar(producto)}
                      >
                        Editar
                      </Boton>
                    )}
                    <Boton
                      variante={producto.activo ? "peligro" : "secundario"}
                      disabled={cambiarEstado.isPending}
                      onClick={() => cambiarEstado.mutate(producto)}
                    >
                      {producto.activo ? "Dar de baja" : "Reactivar"}
                    </Boton>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
