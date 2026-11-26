import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Logo, pesos } from "@ibiza/ui";
import estilos from "./PantallaCliente.module.css";
import {
  type CarritoCliente,
  EVENTO_CARRITO,
  EVENTO_ENTRADA,
  EVENTO_QR,
  EVENTO_VENTA,
  type LineaCliente,
  type QrCliente,
} from "../lib/pantallaCliente";
import {
  CARRITO_VACIO,
  DURACION_DESTACADO,
  DURACION_ENTRADA,
  DURACION_GRACIAS,
  lineaAgregada,
} from "../lib/secuenciaCliente";

type Aviso = "gracias" | "entrada";

// `toque` cambia en cada agregado: con el mismo producto dos veces, el key distinto
// vuelve a montar el destacado y la animación corre de nuevo.
type Destacado = { varianteId: number; toque: number };

export const PantallaCliente = () => {
  const [carrito, setCarrito] = useState<CarritoCliente>(CARRITO_VACIO);
  const [destacado, setDestacado] = useState<Destacado | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [qr, setQr] = useState<QrCliente | null>(null);

  // Los listen se registran una sola vez: adentro, `carrito` quedaría congelado en el
  // valor inicial. El ref siempre tiene el último carrito recibido.
  const anterior = useRef(CARRITO_VACIO);

  useEffect(() => {
    let toques = 0;
    let finDestacado: number | undefined;
    let finAviso: number | undefined;

    // Cada uno borra el temporizador anterior antes de crear el suyo:
    // así lo último que llega reemplaza a lo que se estaba mostrando.
    const mostrarAviso = (tipo: Aviso, duracion: number) => {
      window.clearTimeout(finDestacado);
      window.clearTimeout(finAviso);

      setDestacado(null);
      setAviso(tipo);
      setQr(null);

      finAviso = window.setTimeout(() => setAviso(null), duracion);
    };

    const recibirCarrito = (nuevo: CarritoCliente) => {
      const agregada = lineaAgregada(anterior.current, nuevo);
      anterior.current = nuevo;
      setCarrito(nuevo);
      if (!agregada) return;

      // Agregar algo durante el "Gracias" es el próximo cliente: el aviso se corta.
      window.clearTimeout(finAviso);
      setAviso(null);

      window.clearTimeout(finDestacado);
      setDestacado({ varianteId: agregada.varianteId, toque: ++toques });
      finDestacado = window.setTimeout(
        () => setDestacado(null),
        DURACION_DESTACADO,
      );
    };

    const escuchas = [
      listen<CarritoCliente>(EVENTO_CARRITO, (evento) =>
        recibirCarrito(evento.payload),
      ),
      listen(EVENTO_VENTA, () => mostrarAviso("gracias", DURACION_GRACIAS)),
      listen(EVENTO_ENTRADA, () => mostrarAviso("entrada", DURACION_ENTRADA)),
      // null solo saca el QR. No toca el aviso: si el null llegara después del
      // "Gracias" de esa misma venta, lo cortaría.
      listen<QrCliente | null>(EVENTO_QR, (evento) => {
        if (evento.payload) {
          window.clearTimeout(finDestacado);
          window.clearTimeout(finAviso);
          setDestacado(null);
          setAviso(null);
        }
        setQr(evento.payload);
      }),
    ];

    return () => {
      window.clearTimeout(finDestacado);
      window.clearTimeout(finAviso);
      escuchas.forEach((escucha) => void escucha.then((dejar) => dejar()));
    };
  }, []);

  // Se busca en el carrito actual: si se resta, se ve la cantidad nueva;
  // si se quita la línea, el destacado desaparece solo.
  const actual = destacado
    ? (carrito.lineas.find((l) => l.varianteId === destacado.varianteId) ??
      null)
    : null;

  return (
    <main className={estilos.pantalla}>
      {aviso ? (
        // key por tipo: al cambiar de bloque, React lo vuelve a montar y se anima.
        <div key={aviso} className={estilos.gracias}>
          <Logo variante="triangulo" className={estilos.triangulo} />
          <p className={estilos.titulo}>¡Gracias!</p>
          {aviso === "entrada" && (
            <p className={estilos.subtitulo}>Bienvenidos a Ibiza</p>
          )}
        </div>
      ) : qr ? (
        <PagoQr key="qr" qr={qr} carrito={carrito} />
      ) : carrito.lineas.length > 0 ? (
        <Venta
          key="venta"
          carrito={carrito}
          actual={actual}
          toque={destacado?.toque ?? 0}
        />
      ) : (
        <Logo key="logo" variante="completo" className={estilos.logo} />
      )}
    </main>
  );
};

type VentaProps = {
  carrito: CarritoCliente;
  actual: LineaCliente | null;
  toque: number;
};

const Venta = ({ carrito, actual, toque }: VentaProps) => (
  <div className={estilos.venta}>
    {/* La columna está siempre, aunque vacía: así el CSS puede achicarla de a poco
        y la lista se desliza al centro en vez de saltar. */}
    <div className={estilos.escena}>
      {actual && (
        <div key={toque} className={estilos.destacado}>
          <Foto linea={actual} />
          <p className={estilos.destacadoNombre}>
            {actual.cantidad} x {actual.nombre}
          </p>
        </div>
      )}
    </div>

    <Resumen carrito={carrito} actualId={actual?.varianteId} />
  </div>
);

// La lista con el TOTAL. La usan la venta y el pago con QR, así el cliente
// sigue viendo qué paga mientras escanea.
const Resumen = ({
  carrito,
  actualId,
}: {
  carrito: CarritoCliente;
  // El renglón del producto que se está mostrando grande, para resaltarlo
  actualId?: number;
}) => (
  <div className={estilos.resumen}>
    <ul className={estilos.lista}>
      {carrito.lineas.map((linea) => (
        // key por variante, no por índice: al quitar una línea del medio,
        // los demás renglones no se vuelven a animar.
        <li
          key={linea.varianteId}
          className={`${estilos.linea} ${linea.varianteId === actualId ? estilos.lineaActual : ""}`}
        >
          <Foto linea={linea} className={estilos.miniatura} />
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
      <span>{pesos(carrito.total)}</span>
    </p>
  </div>
);

/*
 * Barra: la lista con el TOTAL a la izquierda y el QR a la derecha.
 * Entrada: la caja no manda el carrito (carrito vacío), así que va el QR solo
 * con el total arriba, para que el cliente sepa cuánto paga antes de escanear.
 */
const PagoQr = ({ qr, carrito }: { qr: QrCliente; carrito: CarritoCliente }) => {
  const conLista = carrito.lineas.length > 0;

  return (
    <div className={conLista ? estilos.pagoConLista : undefined}>
      {conLista && <Resumen carrito={carrito} />}
      <div className={estilos.pago}>
        {!conLista && (
          <p className={estilos.pagoTotal}>
            <span>Total</span>
            <span>{pesos(qr.total)}</span>
          </p>
        )}
        <div className={estilos.qr}>
          {/* size es solo el tamaño de origen: el CSS lo estira a la pantalla y,
              al ser SVG, no se pixela. marginSize 4 es el margen blanco que piden los lectores */}
          <QRCodeSVG value={qr.qrData} size={512} marginSize={4} />
        </div>
        <p className={estilos.pagoAyuda}>Escaneá el código con tu app para pagar</p>
      </div>
    </div>
  );
};

// Sin foto, la inicial, como en la tarjeta de venta.
// className suma una variante de tamaño (la miniatura de la lista) sobre .foto.
const Foto = ({
  linea,
  className,
}: {
  linea: LineaCliente;
  className?: string;
}) => (
  <div className={`${estilos.foto} ${className ?? ""}`}>
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
