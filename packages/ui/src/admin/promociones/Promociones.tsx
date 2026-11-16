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
import { Boton } from "../../componentes/Boton";

// id → nombre. Incluye los dados de baja: una promo puede apuntar a un producto inactivo.
const aMapa = (lista: { id: number; nombre: string }[] | undefined) =>
  new Map((lista ?? []).map((elem) => [elem.id, elem.nombre]));

export function Promociones() {
  const { api } = useApiAdmin();
  const queryClient = useQueryClient();

  const [error, setError] = useState<string | null>(null);

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
  const ocupado = cambiarPausa.isPending || cambiarEstado.isPending;

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
      {!cargando && !errorCarga && promociones.data?.length === 0 && (
        <p className={estilos.ayuda}>Todavía no hay promociones.</p>
      )}

      {!cargando &&
        !errorCarga &&
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
