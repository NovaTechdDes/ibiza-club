import estilos from "../catalogo/Catalogo.module.css";
import { mensajeDeError, useApiAdmin } from "../api";
import { useCategorias } from "../catalogo/useCategorias";
import { useEnvases } from "../catalogo/useEnvases";
import { useProductos } from "../catalogo/useProductos";
import {
  type Nombres,
  textoAlcance,
  textoBeneficio,
  textoVigencia,
} from "./descripcion";
import {
  CLAVE_PROMOCIONES,
  type PromocionListada,
  usePromociones,
} from "./usePromociones";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { type PromocionInput } from "@ibiza/shared";
import { Boton } from "../../componentes/Boton";
import { desdePromo, PROMO_VACIA } from "./formularioPromo";
import { FormularioPromocion } from "./FormularioPromocion";

// id → nombre. Incluye los dados de baja: una promo puede apuntar a un producto inactivo.
const aMapa = (lista: { id: number; nombre: string }[] | undefined) =>
  new Map((lista ?? []).map((elem) => [elem.id, elem.nombre]));

export function Promociones() {
  const { api } = useApiAdmin();
  const queryClient = useQueryClient();

  const [error, setError] = useState<string | null>(null);
  // null = se ve la lista · "nueva" = alta · una promo = edición.
  const [editando, setEditando] = useState<PromocionListada | "nueva" | null>(
    null,
  );

  const promociones = usePromociones();
  const productos = useProductos();
  const categorias = useCategorias();
  const envases = useEnvases();

  const nombres: Nombres = {
    productos: aMapa(productos.data),
    categorias: aMapa(categorias.data),
    envases: aMapa(envases.data),
  };

  // Se espera a las cuatro: sin los nombres, el alcance saldría como "#3".
  const cargando =
    promociones.isPending ||
    productos.isPending ||
    categorias.isPending ||
    envases.isPending;

  const errorCarga =
    promociones.error ?? productos.error ?? categorias.error ?? envases.error;

  const refrescar = () =>
    queryClient.invalidateQueries({ queryKey: CLAVE_PROMOCIONES });

  const guardar = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: number | null;
      input: PromocionInput;
    }) =>
      id === null
        ? (await api.post<PromocionListada>("/promociones", input)).data
        : (await api.put<PromocionListada>(`/promociones/${id}`, input)).data,
    onMutate: () => setError(null),
    // Se vuelve a la lista solo si salió bien: si falla, queda lo escrito.
    onSuccess: () => {
      setEditando(null);
      return refrescar();
    },
    onError: (e) =>
      setError(mensajeDeError(e, "No se pudo guardar la promoción.")),
  });

  const cambiarPausa = useMutation({
    mutationFn: async (promocion: PromocionListada) =>
      (
        await api.post<PromocionListada>(
          `/promociones/${promocion.id}/${promocion.pausada ? "reanudar" : "pausar"}`,
        )
      ).data,
    onMutate: () => setError(null),
    onSuccess: () => refrescar(),
    onError: (e) =>
      setError(mensajeDeError(e, "No se pudo pausar o reanudar la promoción.")),
  });

  const cambiarEstado = useMutation({
    mutationFn: async (promocion: PromocionListada) =>
      (
        await api.post<PromocionListada>(
          `/promociones/${promocion.id}/${promocion.activo ? "baja" : "alta"}`,
        )
      ).data,
    onMutate: () => setError(null),
    onSuccess: () => refrescar(),
    onError: (e) =>
      setError(
        mensajeDeError(e, "No se pudo cambiar el estado de la promoción."),
      ),
  });

  // Un solo pedido a la vez: un segundo toque usaría la promo vieja y desharía el primero.
  const ocupado =
    cambiarPausa.isPending || cambiarEstado.isPending || guardar.isPending;

  const listo = !cargando && !errorCarga;

  return (
    <div className={estilos.pantalla}>
      {cargando && !errorCarga && <p className={estilos.ayuda}>Cargando…</p>}
      {errorCarga && (
        <p className={estilos.error} role="alert">
          {mensajeDeError(errorCarga, "No se pudieron cargar las promociones.")}
        </p>
      )}
      {error && (
        <p className={estilos.error} role="alert">
          {error}
        </p>
      )}

      {listo && editando !== null && (
        <FormularioPromocion
          // El formulario lee `inicial` una sola vez: la key lo remonta al cambiar de promo.
          key={editando === "nueva" ? "nueva" : editando.id}
          inicial={editando === "nueva" ? PROMO_VACIA : desdePromo(editando)}
          categorias={categorias.data ?? []}
          productos={productos.data ?? []}
          envases={envases.data ?? []}
          titulo={
            editando === "nueva"
              ? "Nueva promoción"
              : `Editar: ${editando.nombre}`
          }
          guardando={guardar.isPending}
          onGuardar={(input) =>
            guardar.mutate({
              id: editando === "nueva" ? null : editando.id,
              input,
            })
          }
          onCancelar={() => {
            setEditando(null);
            setError(null);
          }}
        />
      )}

      {listo && editando === null && (
        <div>
          <Boton
            disabled={ocupado}
            onClick={() => {
              setError(null);
              setEditando("nueva");
            }}
          >
            Nueva promoción
          </Boton>
        </div>
      )}

      {listo && editando === null && promociones.data?.length === 0 && (
        <p className={estilos.ayuda}>Todavía no hay promociones.</p>
      )}

      {listo &&
        editando === null &&
        promociones.data &&
        promociones.data.length > 0 && (
          <ul className={estilos.lista}>
            {promociones.data.map((promocion) => (
              <li
                key={promocion.id}
                className={`${estilos.fila} ${promocion.activo ? "" : estilos.inactiva}`}
              >
                <div className={`${estilos.nombre} ${estilos.grupo}`}>
                  <strong>
                    {promocion.nombre} · {textoBeneficio(promocion)}
                  </strong>
                  <span className={estilos.ayuda}>
                    {textoVigencia(promocion)}
                  </span>
                  <span className={estilos.ayuda}>
                    {textoAlcance(promocion, nombres)}
                  </span>
                </div>
                {promocion.pausada && (
                  <span className={estilos.etiqueta}>Pausada</span>
                )}
                {!promocion.activo && (
                  <span className={estilos.etiqueta}>Dada de baja</span>
                )}
                <div className={estilos.acciones}>
                  {promocion.activo ? (
                    <>
                      <Boton
                        variante="secundario"
                        disabled={ocupado}
                        onClick={() => {
                          setError(null);
                          setEditando(promocion);
                        }}
                      >
                        Editar
                      </Boton>
                      <Boton
                        variante="secundario"
                        disabled={ocupado}
                        onClick={() => cambiarPausa.mutate(promocion)}
                      >
                        {promocion.pausada ? "Reanudar" : "Pausar"}
                      </Boton>
                      <Boton
                        variante="peligro"
                        disabled={ocupado}
                        onClick={() => cambiarEstado.mutate(promocion)}
                      >
                        Dar de baja
                      </Boton>
                    </>
                  ) : (
                    <Boton
                      disabled={ocupado}
                      onClick={() => cambiarEstado.mutate(promocion)}
                    >
                      Reactivar
                    </Boton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
