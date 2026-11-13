import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mensajeDeError, useApiAdmin } from "../api";
import { useSesionAdmin } from "../sesion";
import { type FormEvent, useState } from "react";
import {
  type Variante,
  type VarianteInput,
  VarianteInputSchema,
  type VarianteUpdate,
  VarianteUpdateSchema,
} from "@ibiza/shared";
import { Boton } from "../../componentes/Boton";
import { CampoTexto } from "../../componentes/CampoTexto";
import { CampoSelect } from "../../componentes/CampoSelect";

import estilos from "./Catalogo.module.css";
import { useProductos } from "./useProductos";
import { useEnvases } from "./useEnvases";

export const CLAVE_VARIANTES = ["admin", "variantes"] as const;

// GET /variantes trae además el envase (ver `seleccion` en variante.service.ts).
// Vive acá y no en shared porque es la forma de esta respuesta, no la que baja a las cajas.
type VarianteListada = Variante & {
  envase: { id: number; nombre: string };
};

type Formulario = {
  id: number | null;
  productoId: string;
  envaseId: string;
  precio: string;
};

const VACIO: Formulario = { id: null, productoId: "", envaseId: "", precio: "" };

// "" → undefined para que Zod lo marque como faltante en vez de recibir 0.
const aNumero = (texto: string) => (texto.trim() === "" ? undefined : Number(texto));

export function Precios() {
  const { api } = useApiAdmin();
  const queryClient = useQueryClient();

  const esAdmin = useSesionAdmin((estado) => estado.usuario?.rol === "ADMIN");

  const [form, setForm] = useState<Formulario>(VACIO);
  const [error, setError] = useState<string | null>(null);

  const editando = form.id !== null;

  const productos = useProductos();
  const envases = useEnvases();
  const variantes = useQuery({
    queryKey: CLAVE_VARIANTES,
    queryFn: async () => (await api.get<VarianteListada[]>("/variantes")).data,
  });

  const refrescar = () =>
    queryClient.invalidateQueries({ queryKey: CLAVE_VARIANTES });

  // Al editar solo se manda el precio: el PATCH no acepta cambiar producto ni envase.
  const datos = editando
    ? VarianteUpdateSchema.safeParse({ precio: aNumero(form.precio) })
    : VarianteInputSchema.safeParse({
        productoId: aNumero(form.productoId),
        envaseId: aNumero(form.envaseId),
        precio: aNumero(form.precio),
      });

  const guardar = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: number | null;
      input: VarianteInput | VarianteUpdate;
    }) =>
      id === null
        ? (await api.post<VarianteListada>("/variantes", input)).data
        : (
            await api.patch<VarianteListada>(`/variantes/${id}`, {
              precio: input.precio,
            })
          ).data,
    onMutate: () => setError(null),
    // Se conserva el producto para cargar vaso y tanque seguidos sin volver a elegirlo.
    onSuccess: (_variante, { id }) => {
      setForm(id === null ? { ...VACIO, productoId: form.productoId } : VACIO);
      return refrescar();
    },
    onError: (e) =>
      setError(mensajeDeError(e, "No se pudo guardar la variante.")),
  });

  const cambiarEstado = useMutation({
    mutationFn: async (variante: VarianteListada) =>
      (
        await api.post<VarianteListada>(
          `/variantes/${variante.id}/${variante.activo ? "baja" : "alta"}`,
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

  function editar(variante: VarianteListada) {
    setError(null);
    setForm({
      id: variante.id,
      productoId: String(variante.productoId),
      envaseId: String(variante.envaseId),
      precio: String(variante.precio),
    });
  }

  // Al crear, solo los activos (la API rechaza los inactivos). Al editar los selects están
  // bloqueados, pero tienen que tener la opción para mostrar el nombre.
  const opcionesProductos =
    productos.data
      ?.filter((elem) => editando || elem.activo)
      .map((elem) => ({ valor: String(elem.id), texto: elem.nombre })) ?? [];

  // Al crear se sacan los envases que ya tienen variante para el producto elegido.
  // La API igual responde 409, pero así no se ofrece una opción que va a fallar.
  const opcionesEnvases =
    envases.data
      ?.filter(
        (elem) =>
          editando ||
          (elem.activo &&
            !variantes.data?.some(
              (v) =>
                v.productoId === Number(form.productoId) &&
                v.envaseId === elem.id,
            )),
      )
      .map((elem) => ({ valor: String(elem.id), texto: elem.nombre })) ?? [];

  const faltaCatalogo =
    !productos.data?.some((p) => p.activo) || !envases.data?.some((e) => e.activo);

  // Un grupo por producto, en el orden que ya trae la API de productos. Se saltean los que no tienen variantes.
  // Se calcula acá y no adentro del JSX para que el .map del render quede simple.
  const grupos = (productos.data ?? [])
    .map((producto) => ({
      producto,
      variantes: (variantes.data ?? []).filter(
        (variante) => variante.productoId === producto.id,
      ),
    }))
    .filter((grupo) => grupo.variantes.length > 0);

  const cargando = productos.isPending || envases.isPending || variantes.isPending;
  const errorCarga = productos.error ?? envases.error ?? variantes.error;

  return (
    <div className={estilos.pantalla}>
      {/* El Encargado no crea variantes, pero sí ve el formulario cuando toca "Editar precio". */}
      {esAdmin || editando ? (
        !editando && !cargando && faltaCatalogo ? (
          <p className={estilos.ayuda}>
            Primero creá un producto y un envase en sus pestañas.
          </p>
        ) : (
          <form className={estilos.formulario} onSubmit={enviar}>
            <CampoSelect
              etiqueta="Producto"
              placeholder="Elegí un producto"
              opciones={opcionesProductos}
              value={form.productoId}
              disabled={editando}
              onChange={(e) =>
                // Al cambiar de producto se limpia el envase: el elegido puede no estar disponible.
                setForm({ ...form, productoId: e.target.value, envaseId: "" })
              }
              className={estilos.campoLargo}
            />

            <CampoSelect
              etiqueta="Envase"
              placeholder="Elegí un envase"
              opciones={opcionesEnvases}
              value={form.envaseId}
              disabled={editando}
              onChange={(e) => setForm({ ...form, envaseId: e.target.value })}
            />

            <CampoTexto
              etiqueta={editando ? "Precio nuevo" : "Precio"}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={form.precio}
              onChange={(e) => setForm({ ...form, precio: e.target.value })}
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
          Solo el administrador crea variantes. Para cambiar un precio, tocá
          Editar precio.
        </p>
      )}

      {error && (
        <p className={estilos.error} role="alert">
          {error}
        </p>
      )}

      {cargando && <p className={estilos.ayuda}>Cargando…</p>}
      {errorCarga && (
        <p className={estilos.error}>
          {mensajeDeError(errorCarga, "No se pudo cargar el catálogo.")}
        </p>
      )}
      {variantes.data?.length === 0 && (
        <p className={estilos.ayuda}>Todavía no hay variantes.</p>
      )}

      {grupos.map(({ producto, variantes: variantesDelGrupo }) => (
        <section key={producto.id} className={estilos.grupo}>
          <h3 className={estilos.tituloGrupo}>
            {producto.nombre}
            {!producto.activo && " · dado de baja"}
          </h3>
          <ul className={estilos.lista}>
            {variantesDelGrupo.map((variante) => (
              <li
                key={variante.id}
                className={`${estilos.fila} ${variante.activo ? "" : estilos.inactiva}`}
              >
                <strong className={estilos.nombre}>
                  {variante.envase.nombre}
                </strong>
                <span className={estilos.precio}>
                  $ {variante.precio.toLocaleString("es-AR")}
                </span>
                {!variante.activo && (
                  <span className={estilos.etiqueta}>Dada de baja</span>
                )}
                <div className={estilos.acciones}>
                  {/* Admin y Encargado cambian precios. Solo en activas: una dada de baja no se vende. */}
                  {variante.activo && (
                    <Boton
                      variante="secundario"
                      onClick={() => editar(variante)}
                    >
                      Editar precio
                    </Boton>
                  )}
                  {esAdmin && (
                    <Boton
                      variante={variante.activo ? "peligro" : "secundario"}
                      disabled={cambiarEstado.isPending}
                      onClick={() => cambiarEstado.mutate(variante)}
                    >
                      {variante.activo ? "Dar de baja" : "Reactivar"}
                    </Boton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
