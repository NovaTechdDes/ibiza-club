import {
  type Producto,
  TAMANIO_MAXIMO_IMAGEN,
  TIPOS_IMAGEN,
} from "@ibiza/shared";
import { type ChangeEvent, useRef } from "react";
import { Boton } from "../../componentes/Boton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CLAVE_PRODUCTOS } from "./useProductos";
import { mensajeDeError, useApiAdmin } from "../api";
import estilos from "./ImagenProducto.module.css";

type Props = {
  producto: Producto;
  puedeEditar: boolean;
  onError: (mensaje: string | null) => void;
};

const MEGAS = TAMANIO_MAXIMO_IMAGEN / (1024 * 1024);

export const ImagenProducto = ({ producto, puedeEditar, onError }: Props) => {
  const { api } = useApiAdmin();
  const queryClient = useQueryClient();
  const selector = useRef<HTMLInputElement>(null);

  const refrescar = () =>
    queryClient.invalidateQueries({ queryKey: CLAVE_PRODUCTOS });

  const subir = useMutation({
    mutationFn: async (archivo: File) =>
      (
        await api.put<Producto>(`/productos/${producto.id}/imagen`, archivo, {
          headers: { "Content-Type": archivo.type },
        })
      ).data,
    onMutate: () => onError(null),
    onSuccess: () => refrescar(),
    onError: (e) => onError(mensajeDeError(e, "No se pudo subir la foto.")),
  });

  const quitar = useMutation({
    mutationFn: async () =>
      (await api.delete<Producto>(`/productos/${producto.id}/imagen`)).data,
    onMutate: () => onError(null),
    onSuccess: () => refrescar(),
    onError: (e) => onError(mensajeDeError(e, "No se pudo quitar la foto.")),
  });

  function elegir(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!archivo) return;

    if (!TIPOS_IMAGEN.includes(archivo.type)) {
      onError("La foto tiene que ser JPG, PNG o WEBP.");
      return;
    }
    if (archivo.size > TAMANIO_MAXIMO_IMAGEN) {
      onError(`La foto pesa más de ${MEGAS} MB. Achicala y probá de nuevo.`);
      return;
    }
    subir.mutate(archivo);
  }

  const ocupado = subir.isPending || quitar.isPending;

  return (
    <div className={estilos.contenedor}>
      {producto.imagenUrl ? (
        <img
          className={estilos.miniatura}
          src={producto.imagenUrl}
          alt=""
          loading="lazy"
        />
      ) : (
        <span
          className={`${estilos.miniatura} ${estilos.vacia}`}
          aria-hidden="true"
        >
          Sin foto
        </span>
      )}

      {puedeEditar && (
        <>
          <input
            ref={selector}
            type="file"
            accept={TIPOS_IMAGEN.join(",")}
            hidden
            onChange={elegir}
          />
          <Boton
            variante="secundario"
            disabled={ocupado}
            onClick={() => selector.current?.click()}
          >
            {subir.isPending
              ? "Subiendo…"
              : producto.imagenUrl
                ? "Cambiar foto"
                : "Subir foto"}
          </Boton>
          {producto.imagenUrl && (
            <Boton
              variante="peligro"
              disabled={ocupado}
              onClick={() => quitar.mutate()}
            >
              {quitar.isPending ? "Quitando…" : "Quitar"}
            </Boton>
          )}
        </>
      )}
    </div>
  );
};
