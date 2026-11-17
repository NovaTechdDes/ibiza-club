import { LARGO_PIN, UsuarioListado, UsuarioPinSchema } from "@ibiza/shared";
import { mensajeDeError, useApiAdmin } from "../api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { CLAVE_USUARIOS } from "./useUsuarios";
import estilos from "../catalogo/Catalogo.module.css";
import { CampoTexto } from "../../componentes/CampoTexto";
import { Boton } from "../../componentes/Boton";

type Props = {
  usuario: UsuarioListado;
  onListo: () => void;
};

const soloDigitos = (texto: string) => texto.replace(/\D/g, "");

export function CambiarPin({ usuario, onListo }: Props) {
  const { api } = useApiAdmin();
  const queryClient = useQueryClient();
  const [pin, setPin] = useState("");
  const [repetido, setRepetido] = useState("");
  const [error, setError] = useState<string | null>(null);

  const datos = UsuarioPinSchema.safeParse({ pin });
  const coinciden = pin === repetido;

  const guardar = useMutation({
    mutationFn: async (nuevo: string) =>
      (
        await api.put<UsuarioListado>(`/usuarios/${usuario.id}/pin`, {
          pin: nuevo,
        })
      ).data,
    onMutate: () => setError(null),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CLAVE_USUARIOS });
      onListo();
    },
    onError: (e) => setError(mensajeDeError(e, "No se pudo cambiar el PIN.")),
  });

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!datos.success || !coinciden) return;
    guardar.mutate(datos.data.pin);
  }

  return (
    <>
      <form className={estilos.formulario} onSubmit={enviar}>
        <CampoTexto
          etiqueta={`PIN nuevo de ${usuario.nombre}`}
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={LARGO_PIN}
          value={pin}
          onChange={(e) => setPin(soloDigitos(e.target.value))}
          className={estilos.campoCorto}
        />
        <CampoTexto
          etiqueta="Repetir PIN"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={LARGO_PIN}
          value={repetido}
          onChange={(e) => setRepetido(soloDigitos(e.target.value))}
          className={estilos.campoCorto}
        />
        <Boton
          type="submit"
          disabled={!datos.success || !coinciden || guardar.isPending}
        >
          {guardar.isPending ? "Guardando…" : "Cambiar PIN"}
        </Boton>
        <Boton variante="secundario" onClick={onListo}>
          Cancelar
        </Boton>
      </form>

      {repetido.length === LARGO_PIN && !coinciden && (
        <p className={estilos.error}>Los PIN no coinciden.</p>
      )}
      <p className={estilos.ayuda}>
        Llega a las cajas con la próxima sincronización. Una caja sin internet
        sigue aceptando el PIN anterior hasta que se conecte.
      </p>
      {error && (
        <p className={estilos.error} role="alert">
          {error}
        </p>
      )}
    </>
  );
}
