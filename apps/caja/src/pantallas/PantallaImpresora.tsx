import { Boton, CampoTexto, Tarjeta } from "@ibiza/ui";
import estilos from "./PantallaImpresora.module.css";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { imprimirPrueba } from "../lib/impresora";
import { ConfigImpresora, guardarImpresora } from "../db/ajustes";
import { CLAVE_IMPRESORA, useImpresora } from "../hooks/useImpresora";

const POR_DEFECTO: ConfigImpresora = { ip: "", puerto: 9100, ancho: 42 };

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

type Campos = { ip: string; puerto: string; ancho: string };

// Devuelve la config lista para usar, o el motivo por el que no sirve
function validar(campos: Campos): ConfigImpresora | string {
  const ip = campos.ip.trim();
  const partes = IPV4.exec(ip);
  if (!partes || partes.slice(1).some((parte) => Number(parte) > 255)) {
    return "La IP no es válida (ej: 192.168.0.15).";
  }

  const puerto = Number(campos.puerto);
  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
    return "El puerto va de 1 a 65535.";
  }

  const ancho = Number(campos.ancho);
  if (!Number.isInteger(ancho) || ancho < 24 || ancho > 64) {
    return "El ancho va de 24 a 64 columnas.";
  }

  return {
    ip,
    puerto,
    ancho,
  };
}

type Props = { onVolver: () => void };

// Espera a que se lea la config y recién ahí arma el formulario con esos valores
export function PantallaImpresora({ onVolver }: Props) {
  const { data, isPending, isError } = useImpresora();

  if (isPending) return null;

  if (isError) {
    return (
      <div className={estilos.pantalla}>
        <Tarjeta className={estilos.tarjeta}>
          <p className={estilos.error}>
            No se pudo leer la configuración de la impresora.
          </p>
          <Boton variante="secundario" onClick={onVolver}>
            Volver
          </Boton>
        </Tarjeta>
      </div>
    );
  }
  return <Formulario inicial={data ?? POR_DEFECTO} onVolver={onVolver} />;
}

function Formulario({
  inicial,
  onVolver,
}: Props & { inicial: ConfigImpresora }) {
  const queryClient = useQueryClient();
  const [campos, setCampos] = useState<Campos>({
    ip: inicial.ip,
    puerto: String(inicial.puerto),
    ancho: String(inicial.ancho),
  });

  const resultado = validar(campos);
  const config = typeof resultado === "string" ? null : resultado;

  const probar = useMutation({
    mutationFn: (config: ConfigImpresora) =>
      imprimirPrueba(config.ip, config.puerto),
  });

  const guardar = useMutation({
    mutationFn: async (config: ConfigImpresora) => {
      await guardarImpresora(config);
      return config;
    },
    onSuccess: (config) => {
      queryClient.setQueryData(CLAVE_IMPRESORA, config);
      onVolver();
    },
  });

  function cambiar(campo: keyof Campos, valor: string) {
    probar.reset();
    guardar.reset();
    setCampos((actual) => ({ ...actual, [campo]: valor }));
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (config) guardar.mutate(config);
  }

  const ocupado = probar.isPending || guardar.isPending;

  return (
    <div className={estilos.pantalla}>
      <Tarjeta className={estilos.tarjeta}>
        <h1 className={estilos.titulo}>Impresora de esta PC</h1>

        <form action="" className={estilos.formulario} onSubmit={enviar}>
          <CampoTexto
            etiqueta="IP de la impresora"
            value={campos.ip}
            onChange={(e) => cambiar("ip", e.target.value)}
            inputMode="decimal"
            spellCheck={false}
            autoComplete="off"
          />

          <div className={estilos.fila}>
            <CampoTexto
              etiqueta="Puerto"
              value={campos.puerto}
              onChange={(e) => cambiar("puerto", e.target.value)}
              inputMode="numeric"
              autoComplete="off"
            />
            <CampoTexto
              etiqueta="Columnas por renglón"
              value={campos.ancho}
              onChange={(e) => cambiar("ancho", e.target.value)}
              inputMode="numeric"
              autoComplete="off"
            />
          </div>

          {!config && campos.ip.trim() !== "" && (
            <p className={estilos.error}>{resultado as string}</p>
          )}
          {/* El error de Rust llega como texto, no como Error */}
          {probar.isError && (
            <p className={estilos.error}>{String(probar.error)}</p>
          )}
          {guardar.isError && (
            <p className={estilos.error}>
              No se pudo guardar la configuración.
            </p>
          )}
          {/* Ok solo quiere decir que los bytes salieron: hay que mirar el papel */}
          {probar.isSuccess && (
            <p className={estilos.aviso}>
              Enviado. Fijate si salió la hoja de prueba.
            </p>
          )}

          <div className={estilos.botones}>
            <Boton
              type="button"
              variante="secundario"
              onClick={onVolver}
              disabled={ocupado}
            >
              Volver
            </Boton>

            <Boton
              type="button"
              variante="secundario"
              disabled={!config || ocupado}
              onClick={() => config && probar.mutate(config)}
            >
              {probar.isPending ? "Probando..." : "Probar"}
            </Boton>
            <Boton type="submit" disabled={!config || ocupado}>
              {guardar.isPending ? "Guardando..." : "Guardar"}
            </Boton>
          </div>
        </form>
      </Tarjeta>
    </div>
  );
}
