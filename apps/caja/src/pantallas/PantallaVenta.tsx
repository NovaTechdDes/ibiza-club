import {
  Administracion,
  Boton,
  BotonTema,
  IconoAdministracion,
  IconoAnulacion,
  IconoCambiarUsuario,
  IconoCandado,
  IconoCarrito,
  IconoEfectivo,
  IconoImpresora,
  IconoPapelera,
  IconoRetiro,
  IconoTarjeta,
  IconoTransferencia,
  Logo,
  Pestanas,
  Tarjeta,
} from "@ibiza/ui";
import { useCarrito } from "../stores/carrito";
import {
  MEDIOS_PAGO,
  NOMBRE_MEDIO,
  NOMBRE_SECCION,
  type Seccion,
  SECCIONES_POR_TIPO,
  NOMBRE_TIPO_CAJA,
  type MedioPago,
} from "@ibiza/shared";
import { confirmar } from "../lib/alertas";
import { AvisoActualizacion } from "../componentes/AvisoActualizacion";

import estilos from "./PantallaVenta.module.css";
import { type Vinculacion } from "../db/ajustes";
import { useCategoriaVenta, useTipoCaja } from "../hooks/useCatalogo";
import { useSesion } from "../stores/sesion";
import { useState } from "react";
import { BarraCategorias } from "../componentes/BarraCategorias";
import { TarjetaProducto } from "../componentes/TarjetaProducto";
import { useCarritoCalculado } from "../hooks/useCarritoCalculado";
import { LineaCarrito } from "../componentes/LineaCarrito";
import { useCobrar } from "../hooks/useCobrar";
import { PedirPin } from "../componentes/PedirPin";
import { PantallaImpresora } from "./PantallaImpresora";
import { PantallaRetiro } from "./PantallaRetiro";
import { IndicadorSync } from "../componentes/IndicadorSync";
import { registrarAuditoria } from "../db/auditoria";
import { PantallaCambioCajero } from "./PantallaCambioCajero";
import { PantallaAnulacion } from "./PantallaAnulacion";
import { PantallaCierre } from "./PantallaCierre";
import { useQueryClient } from "@tanstack/react-query";
import { CLAVE_BAJADA } from "../hooks/useBajada";
import { puedeAutorizar, ROLES_AUTORIZAN } from "../lib/autorizacion";
import type { Usuario } from "../db/usuario";
import { useApertura } from "../hooks/useApertura";
import { fechaTicket } from "../lib/ticket";
import { descartarCarrito } from "../lib/descartes";

interface Props {
  vinculacion: Vinculacion;
}

// Record: si se agrega un medio de pago en shared, TS obliga a darle un ícono
const ICONO_MEDIO: Record<MedioPago, typeof IconoEfectivo> = {
  EFECTIVO: IconoEfectivo,
  TRANSFERENCIA: IconoTransferencia,
  TARJETA: IconoTarjeta,
};

export function PantallaVenta({ vinculacion }: Props) {
  const usuario = useSesion((estado) => estado.usuario);
  const { data: apertura } = useApertura();
  const queryClient = useQueryClient();

  const carrito = useCarritoCalculado();
  const agregar = useCarrito((estado) => estado.agregar);
  const cambiarCantidad = useCarrito((estado) => estado.cambiarCantidad);

  const cobrar = useCobrar();

  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [seccionElegida, setSeccionElegida] = useState<Seccion>("BEBIDA");

  const [vista, setVista] = useState<
    | "venta"
    | "pin"
    | "impresora"
    | "retiro"
    | "cambio"
    | "anulacion"
    | "cierre"
    | "admin"
  >("venta");

  const { data: categorias } = useCategoriaVenta();
  const { data: tipo } = useTipoCaja();

  const secciones = (tipo ? SECCIONES_POR_TIPO[tipo] : []).filter((s) =>
    categorias?.some((c) => c.seccion === s),
  );

  const seccion = secciones.includes(seccionElegida)
    ? seccionElegida
    : secciones[0];

  const categoriasSeccion = categorias?.filter((c) => c.seccion === seccion);

  const categoriaActual =
    categoriasSeccion?.find((c) => c.id === categoriaId) ??
    categoriasSeccion?.[0];

  async function pedirVaciar() {
    if (!usuario) return;
    if (await confirmar("¿Vaciar el carrito?", "Vaciar", { peligro: true }))
      descartarCarrito(usuario.id);
  }

  function volverDeAdmin() {
    queryClient.removeQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: CLAVE_BAJADA });
    setVista("venta");
  }

  function abrirImpresora(quien: Usuario) {
    registrarAuditoria({
      accion: "CONFIG_IMPRESORA",
      usuarioId: quien.id,
    }).catch(console.error);
    setVista("impresora");
  }

  function pedirImpresora() {
    if (puedeAutorizar(usuario)) {
      abrirImpresora(usuario);
    } else {
      setVista("pin");
    }
  }

  // Estos returns van después de todos los hooks: React exige que se llamen
  // siempre los mismos y en el mismo orden en cada render
  if (vista === "pin") {
    return (
      <PedirPin
        titulo="¿Quién configura la impresora?"
        roles={ROLES_AUTORIZAN}
        onCancelar={() => setVista("venta")}
        onCorrecto={abrirImpresora}
      />
    );
  }

  if (vista === "anulacion") {
    return <PantallaAnulacion onVolver={() => setVista("venta")} />;
  }

  if (vista === "cambio") {
    return <PantallaCambioCajero onVolver={() => setVista("venta")} />;
  }

  if (vista === "impresora") {
    return <PantallaImpresora onVolver={() => setVista("venta")} />;
  }

  if (vista === "retiro") {
    return <PantallaRetiro onVolver={() => setVista("venta")} />;
  }

  if (vista === "cierre") {
    return <PantallaCierre onVolver={() => setVista("venta")} />;
  }

  if (vista === "admin") {
    return (
      <Administracion apiUrl={vinculacion.apiUrl} onVolver={volverDeAdmin} />
    );
  }

  return (
    <div className={estilos.pantalla}>
      <header className={estilos.encabezado}>
        <Logo variante="triangulo" />
        <div className={estilos.identidad}>
          <span className={estilos.caja}>{vinculacion.cajaNombre}</span>
          <span className={estilos.cajero}>{usuario?.nombre}</span>
          {tipo === "ENTRADA" && (
            <p className={estilos.etiqueta}>{NOMBRE_TIPO_CAJA[tipo]}</p>
          )}
        </div>
        {/* La misma letra y fecha que salen en el ticket: el encargado las compara con la barra.
            Solo con jornada: sin jornada se calculan en cada venta y pueden cambiar en el corte */}
        {apertura?.jornadaLetra && apertura.jornadaFecha && (
          <div className={estilos.jornada}>
            <span className={estilos.letra}>{apertura.jornadaLetra}</span>
            <span className={estilos.fecha}>
              {fechaTicket(apertura.jornadaFecha)}
            </span>
          </div>
        )}
        <IndicadorSync />
        <AvisoActualizacion />
        {cobrar.data && (
          <span className={estilos.ultima}>Última venta: #{cobrar.data}</span>
        )}

        {/* Con productos en el carrito no se sale de la venta: se perdería la compra en curso */}
        <div className={estilos.acciones}>
          <Boton
            variante="secundario"
            className={estilos.accion}
            disabled={carrito.cantidad > 0}
            onClick={() => setVista("admin")}
          >
            <IconoAdministracion />
            Administración
          </Boton>
          <Boton
            variante="secundario"
            className={estilos.accion}
            disabled={carrito.cantidad > 0}
            onClick={pedirImpresora}
          >
            <IconoImpresora />
            Impresora
          </Boton>
          <Boton
            variante="secundario"
            className={estilos.accion}
            disabled={carrito.cantidad > 0}
            onClick={() => setVista("retiro")}
          >
            <IconoRetiro />
            Retiro
          </Boton>
          <Boton
            variante="secundario"
            className={estilos.accion}
            disabled={carrito.cantidad > 0}
            onClick={() => setVista("anulacion")}
          >
            <IconoAnulacion />
            Anulación
          </Boton>
        </div>

        <div className={estilos.sesion}>
          <BotonTema className={estilos.tema} />
          <Boton
            variante="secundario"
            className={estilos.accion}
            disabled={carrito.cantidad > 0}
            onClick={() => setVista("cambio")}
          >
            <IconoCambiarUsuario />
            Cambiar cajero
          </Boton>
          {/* Lejos de Retiro/Anulación y en rojo: cerrar la caja no tiene vuelta atrás */}
          <Boton
            variante="peligro"
            className={`${estilos.accion} ${estilos.accionPeligro}`}
            disabled={carrito.cantidad > 0}
            onClick={() => setVista("cierre")}
          >
            <IconoCandado />
            Cerrar caja
          </Boton>
        </div>
      </header>

      <Tarjeta className={estilos.productos}>
        {categoriasSeccion && categoriaActual ? (
          <>
            {secciones.length > 1 && (
              <Pestanas
                pestanas={secciones.map((s) => ({
                  id: s,
                  titulo: NOMBRE_SECCION[s],
                }))}
                elegida={seccion}
                onElegir={setSeccionElegida}
              />
            )}

            <BarraCategorias
              categorias={categoriasSeccion}
              seleccionadaId={categoriaActual.id}
              onElegir={setCategoriaId}
            />
            <div className={estilos.grilla}>
              {categoriaActual.productos.map((producto) => (
                <TarjetaProducto
                  key={producto.id}
                  producto={producto}
                  onElegir={(variante) => {
                    // Mientras imprime, el carrito es el de la venta en curso: no se toca
                    if (!cobrar.isPending) agregar(producto, variante);
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <p className={estilos.vacio}>
            {tipo === "ENTRADA"
              ? "No hay entradas cargadas"
              : "Todavía no hay productos. Esperá la sincronización."}
          </p>
        )}
      </Tarjeta>

      <Tarjeta className={estilos.carrito}>
        <div className={estilos.carritoEncabezado}>
          <span className={estilos.carritoTitulo}>
            Carrito
            <span className={estilos.contador}>{carrito.cantidad}</span>
          </span>
          {/* Arriba y discreto, lejos de los botones de pago (además pide confirmación) */}
          <button
            type="button"
            className={estilos.vaciar}
            disabled={carrito.cantidad === 0 || cobrar.isPending}
            onClick={pedirVaciar}
          >
            <IconoPapelera tamaño={16} />
            Vaciar
          </button>
        </div>

        <div className={estilos.items}>
          {carrito.cantidad === 0 && (
            <div className={estilos.carritoVacio}>
              <IconoCarrito tamaño={36} strokeWidth={1.5} />
              <p>Tocá un producto para agregarlo.</p>
            </div>
          )}
          {carrito.lineas.map((linea) => (
            <LineaCarrito
              linea={linea}
              key={linea.varianteId}
              onCambiar={(cambio) => {
                if (!cobrar.isPending)
                  cambiarCantidad(linea.varianteId, cambio);
              }}
            />
          ))}
        </div>

        <div className={estilos.resumen}>
          {carrito.descuento > 0 && (
            <>
              <div className={estilos.renglon}>
                <span>Subtotal</span>
                <span>$ {carrito.subTotal.toLocaleString("es-AR")}</span>
              </div>
              <div className={`${estilos.renglon} ${estilos.descuento}`}>
                <span>Descuento</span>
                <span>-$ {carrito.descuento.toLocaleString("es-AR")}</span>
              </div>
            </>
          )}
          <div className={estilos.total}>
            <span className={estilos.totalEtiqueta}>Total</span>
            <span>
              <span className={estilos.moneda}>$</span>
              {carrito.total.toLocaleString("es-AR")}
            </span>
          </div>
        </div>

        <div className={estilos.pagos}>
          {MEDIOS_PAGO.map((medio) => {
            const Icono = ICONO_MEDIO[medio];
            return (
              <Boton
                key={medio}
                className={estilos.pago}
                disabled={cobrar.isPending || carrito.cantidad === 0}
                onClick={() => cobrar.mutate(medio)}
              >
                <Icono tamaño={26} />
                {NOMBRE_MEDIO[medio]}
              </Boton>
            );
          })}
        </div>
      </Tarjeta>
    </div>
  );
}
