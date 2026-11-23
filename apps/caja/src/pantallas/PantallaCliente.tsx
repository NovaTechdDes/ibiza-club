import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import estilos from "./PantallaCliente.module.css";
import { EVENTO_ENTRADA } from "../lib/pantallaCliente";
import { Logo } from "@ibiza/ui";

const DURACION_MS = 6000;

export const PantallaCliente = () => {
  const [agradeciendo, setAgradeciendo] = useState(false);

  useEffect(() => {
    let temporizador: number | undefined;

    const dejarDeEscuchar = listen(EVENTO_ENTRADA, () => {
      setAgradeciendo(true);

      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(
        () => setAgradeciendo(false),
        DURACION_MS,
      );
    });

    return () => {
      window.clearTimeout(temporizador);
      void dejarDeEscuchar.then((dejar) => dejar());
    };
  }, []);

  return (
    <main className={estilos.pantalla}>
      {agradeciendo ? (
        <div key="gracias" className={estilos.gracias}>
          <Logo variante="triangulo" className={estilos.triangulo} />
          <p className={estilos.titulo}>¡Gracias!</p>
          <p className={estilos.subtitulo}>Bienvenidos a Ibiza</p>
        </div>
      ) : (
        <Logo key="logo" variante="completo" className={estilos.logo} />
      )}
    </main>
  );
};
