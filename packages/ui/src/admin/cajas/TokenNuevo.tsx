import { useState } from "react";
import { useApiAdmin } from "../api";
import { Boton } from "../../componentes/Boton";
import estilos from "./TokenNuevo.module.css";

type Props = {
  nombreCaja: string;
  token: string;
  onCerrar: () => void;
};

type Copiado = "url" | "token" | null;

export const TokenNuevo = ({ nombreCaja, token, onCerrar }: Props) => {
  const { apiUrl } = useApiAdmin();
  const [copiado, setCopiado] = useState<Copiado>(null);

  async function copiar(que: Exclude<Copiado, null>, texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(que);
    } catch {
      setCopiado(null);
    }
  }

  return (
    <section className={estilos.cartel} aria-live="polite">
      <strong>Vincular {nombreCaja}</strong>
      <p className={estilos.aviso}>
        Cargá estos dos datos en la PC de la caja. El token se muestra una sola
        vez: si lo perdés, generá uno nuevo
      </p>

      <div className={estilos.dato}>
        <span className={estilos.etiqueta}>URL de la API</span>
        <code className={estilos.valor}>{apiUrl}</code>
        <Boton variante="secundario" onClick={() => copiar("url", apiUrl)}>
          {copiado === "url" ? "Copiada" : "Copiar"}
        </Boton>
      </div>

      <div className={estilos.dato}>
        <span className={estilos.etiqueta}>Token</span>
        <code className={estilos.valor}>{token}</code>
        <Boton variante="secundario" onClick={() => copiar("token", token)}>
          {copiado === "token" ? "Copiado" : "Copiar"}
        </Boton>
      </div>

      <div>
        <Boton onClick={onCerrar}>Listo, ya lo cargué</Boton>
      </div>
    </section>
  );
};
