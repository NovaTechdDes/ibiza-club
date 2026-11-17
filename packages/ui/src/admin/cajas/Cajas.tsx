import { type FormEvent, useState } from "react";
import { Boton } from "../../componentes/Boton";
import { CampoTexto } from "../../componentes/CampoTexto";

import estilos from "../catalogo/Catalogo.module.css";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mensajeDeError, useApiAdmin } from "../api";
import {
  type Caja,
  type CajaInput,
  CajaInputSchema,
  type CajaListado,
} from "@ibiza/shared";
import { CLAVE_CAJAS, useCajas } from "./useCajas";
import { TokenNuevo } from "./TokenNuevo";

type Formulario = { id: number | null; barra: string; nombre: string };
const VACIO: Formulario = { id: null, barra: "", nombre: "" };

type Accion = "generar" | "revocar";

export function Cajas() {
  const { api } = useApiAdmin();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<Formulario>(VACIO);
  const [error, setError] = useState<string | null>(null);
  const [tokenNuevo, setTokenNuevo] = useState<{
    nombreCaja: string;
    token: string;
  } | null>(null);
  const [confirmado, setConfirmado] = useState<{
    cajaId: number;
    accion: Accion;
  } | null>(null);

  const cajas = useCajas();

  const refrescar = () =>
    queryClient.invalidateQueries({ queryKey: CLAVE_CAJAS });

  const datos = CajaInputSchema.safeParse({
    // Vacío = sin barra. En la edición, null es lo que le quita la ubicación a la caja.
    barra: form.barra.trim() === "" ? null : form.barra,
    nombre: form.nombre.trim() === "" ? undefined : form.nombre,
  });

  const guardar = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: number | null;
      input: CajaInput;
    }) =>
      id === null
        ? (await api.post<Caja>("/cajas", input)).data
        : (await api.patch<Caja>(`/cajas/${id}`, input)).data,
    onMutate: () => setError(null),
    onSuccess: () => {
      setForm(VACIO);
      return refrescar();
    },
    onError: (e) => setError(mensajeDeError(e, "No se pudo guardar la caja.")),
  });

  const cambiarEstado = useMutation({
    mutationFn: async (caja: Caja) =>
      (
        await api.post<Caja>(
          `/cajas/${caja.id}/${caja.activo ? "baja" : "alta"}`,
        )
      ).data,
    onMutate: () => setError(null),
    onSuccess: () => refrescar(),
    onError: (e) =>
      setError(mensajeDeError(e, "No se pudo cambiar el estado.")),
  });

  const generarToken = useMutation({
    mutationFn: async (caja: CajaListado) =>
      (
        await api.post<{ cajaId: number; token: string }>(
          `/cajas/${caja.id}/token`,
        )
      ).data,
    onMutate: () => setError(null),
    onSuccess: (respuesta, caja) => {
      setTokenNuevo({ nombreCaja: caja.nombre, token: respuesta.token });
      setConfirmado(null);
      return refrescar();
    },
    onError: (e) => setError(mensajeDeError(e, "No se pudo generar el token")),
  });

  const revocarToken = useMutation({
    mutationFn: async (id: number) =>
      (await api.delete(`/cajas/${id}/token`)).data,
    onMutate: () => setError(null),
    onSuccess: () => {
      setConfirmado(null);
      return refrescar();
    },
    onError: (e) => setError(mensajeDeError(e, "no se pudo eliminar el token")),
  });

  function pedir(caja: CajaListado, accion: Accion) {
    const necesitaConfirmar = accion === "revocar" || caja.vinculada;
    const yaConfirmado =
      confirmado?.cajaId === caja.id && confirmado.accion === accion;

    if (necesitaConfirmar && !yaConfirmado) {
      setConfirmado({ cajaId: caja.id, accion });
      return;
    }
    if (accion === "generar") generarToken.mutate(caja);
    else revocarToken.mutate(caja.id);
  }

  const esperando = (caja: CajaListado, accion: Accion) =>
    confirmado?.cajaId === caja.id && confirmado.accion === accion;

  // Evita que un doble toque en "¿Seguro?" genere dos tokens: el del cartel no sería el guardado.
  const tokenOcupado = generarToken.isPending || revocarToken.isPending;

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!datos.success) return;
    guardar.mutate({ id: form.id, input: datos.data });
  }

  function editar(caja: Caja) {
    setError(null);
    setForm({
      id: caja.id,
      barra: caja.barra ?? "",
      nombre: caja.nombre,
    });
  }

  const editando = form.id !== null;

  return (
    <div className={estilos.pantalla}>
      <form className={estilos.formulario} onSubmit={enviar}>
        <CampoTexto
          etiqueta={editando ? "Editando caja" : "Nueva caja"}
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          className={estilos.campoLargo}
        />
        <CampoTexto
          etiqueta="Barra"
          value={form.barra}
          onChange={(e) => setForm({ ...form, barra: e.target.value })}
          className={estilos.campoLargo}
        />
        <Boton type="submit" disabled={!datos.success || guardar.isPending}>
          {guardar.isPending ? "Guardando…" : editando ? "Guardar" : "Agregar"}
        </Boton>
        {editando && (
          <Boton variante="secundario" onClick={() => setForm(VACIO)}>
            Cancelar
          </Boton>
        )}
      </form>

      {error && (
        <p className={estilos.error} role="alert">
          {error}
        </p>
      )}

      {tokenNuevo && (
        <TokenNuevo
          nombreCaja={tokenNuevo.nombreCaja}
          token={tokenNuevo.token}
          onCerrar={() => setTokenNuevo(null)}
        />
      )}

      {cajas.isPending && <p className={estilos.ayuda}>Cargando…</p>}
      {cajas.isError && (
        <p className={estilos.error}>
          {mensajeDeError(cajas.error, "No se pudieron cargar las cajas.")}
        </p>
      )}
      {cajas.data?.length === 0 && (
        <p className={estilos.ayuda}>Todavía no hay cajas.</p>
      )}

      {cajas.data && cajas.data.length > 0 && (
        <ul className={estilos.lista}>
          {cajas.data.map((caja) => (
            <li
              key={caja.id}
              className={`${estilos.fila} ${caja.activo ? "" : estilos.inactiva}`}
            >
              <strong className={estilos.nombre}>{caja.nombre}</strong>
              {caja.barra && (
                <span className={estilos.ayuda}>{caja.barra}</span>
              )}
              <span className={estilos.etiqueta}>
                {caja.vinculada ? "Vinculada" : "Sin vincular"}
              </span>
              {!caja.activo && (
                <span className={estilos.etiqueta}>Dada de baja</span>
              )}

              <div className={estilos.acciones}>
                <Boton variante="secundario" onClick={() => editar(caja)}>
                  Editar
                </Boton>

                {caja.activo && (
                  <Boton
                    variante="secundario"
                    disabled={tokenOcupado}
                    onClick={() => pedir(caja, "generar")}
                  >
                    {esperando(caja, "generar")
                      ? "¿Seguro?"
                      : caja.vinculada
                        ? "Nuevo Token"
                        : "Generar Token"}
                  </Boton>
                )}

                {caja.vinculada && caja.activo && (
                  <Boton
                    variante="peligro"
                    disabled={tokenOcupado}
                    onClick={() => pedir(caja, "revocar")}
                  >
                    {esperando(caja, "revocar") ? "¿Seguro?" : "Desvincular"}
                  </Boton>
                )}

                {confirmado?.cajaId === caja.id && (
                  <Boton
                    variante="secundario"
                    onClick={() => setConfirmado(null)}
                  >
                    Cancelar
                  </Boton>
                )}
                <Boton
                  variante={caja.activo ? "peligro" : "secundario"}
                  disabled={cambiarEstado.isPending}
                  onClick={() => cambiarEstado.mutate(caja)}
                >
                  {caja.activo ? "Dar de baja" : "Reactivar"}
                </Boton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
