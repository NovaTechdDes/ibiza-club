import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import { Logo, pesos } from "@ibiza/ui";
import estilos from "./PantallaCliente.module.css";
import {
  EVENTO_ENTRADA,
  EVENTO_VENTA,
  type LineaCliente,
  type VentaCliente,
} from "../lib/pantallaCliente";
import {
  pasosDeEntrada,
  pasosDeVenta,
  type Modo,
  type Paso,
} from "../lib/secuenciaCliente";

const LOGO: Modo = { tipo: "logo" };

export const PantallaCliente = () => {
  const [modo, setModo] = useState<Modo>(LOGO);

  useEffect(() => {
    let temporizadores: number[] = [];

    const cancelar = () => {
      temporizadores.forEach((t) => window.clearTimeout(t));
      temporizadores = [];
    };

    // Programa todos los pasos de una vez, uno detrás del otro, y al final vuelve al logo.
    // Si llega otro evento, cancelar() corta lo que quedaba y empieza de cero.
    const correr = (pasos: Paso[]) => {
      cancelar();
      let espera = 0;
      for (const paso of pasos) {
        temporizadores.push(
          window.setTimeout(() => setModo(paso.modo), espera),
        );
        espera += paso.duracion;
      }
      temporizadores.push(window.setTimeout(() => setModo(LOGO), espera));
    };

    const escuchas = [
      listen(EVENTO_ENTRADA, () => correr(pasosDeEntrada())),
      listen<VentaCliente>(EVENTO_VENTA, (evento) =>
        correr(pasosDeVenta(evento.payload)),
      ),
    ];

    return () => {
      cancelar();
      escuchas.forEach((escucha) => void escucha.then((dejar) => dejar()));
    };
  }, []);

  return <main className={estilos.pantalla}>{contenido(modo)}</main>;
};

// Cada bloque lleva un key distinto: al cambiar de modo, React lo vuelve a montar
// y la animación de entrada corre otra vez
const contenido = (modo: Modo) => {
  switch (modo.tipo) {
    case "logo":
      return <Logo key="logo" variante="completo" className={estilos.logo} />;

    case "entrada":
    case "gracias":
      return (
        <div key={modo.tipo} className={estilos.gracias}>
          <Logo variante="triangulo" className={estilos.triangulo} />
          <p className={estilos.titulo}>¡Gracias!</p>
          {modo.tipo === "entrada" && (
            <p className={estilos.subtitulo}>Bienvenidos a Ibiza</p>
          )}
        </div>
      );

    case "venta":
      return (
        <Venta
          key="venta"
          venta={modo.venta}
          actual={modo.actual}
          enLista={modo.enLista}
        />
      );
  }
};

type ModoVenta = Extract<Modo, { tipo: "venta" }>;

const Venta = ({ venta, actual, enLista }: Omit<ModoVenta, "tipo">) => (
  <div className={estilos.venta}>
    {actual && (
      // key con el número de línea: cada producto nuevo se monta de cero y se anima
      <div key={enLista} className={estilos.destacado}>
        <Foto linea={actual} />
        <p className={estilos.destacadoNombre}>
          {actual.cantidad} x {actual.nombre}
        </p>
      </div>
    )}

    <div className={estilos.resumen}>
      <ul className={estilos.lista}>
        {venta.lineas.slice(0, enLista).map((linea, i) => (
          <li key={i} className={estilos.linea}>
            <span>
              {linea.cantidad} x {linea.nombre}
            </span>
            <span>{pesos(linea.subTotal)}</span>
            {linea.descuento > 0 && (
              <>
                <span className={estilos.promo}>
                  {linea.promocionNombre ?? "Promo"}
                </span>
                <span className={estilos.promo}>-{pesos(linea.descuento)}</span>
              </>
            )}
          </li>
        ))}
      </ul>

      <p className={estilos.total}>
        <span>TOTAL</span>
        <span>{pesos(venta.total)}</span>
      </p>
    </div>
  </div>
);

// Sin foto, la inicial, como en la tarjeta de venta
const Foto = ({ linea }: { linea: LineaCliente }) => (
  <div className={estilos.foto}>
    {linea.imagen ? (
      <img
        src={linea.imagen}
        className={estilos.imagen}
        alt=""
        draggable={false}
      />
    ) : (
      <span className={estilos.inicial} aria-hidden="true">
        {linea.nombre.charAt(0)}
      </span>
    )}
  </div>
);
