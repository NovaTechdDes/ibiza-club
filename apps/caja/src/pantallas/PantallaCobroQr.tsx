import { Boton } from "@ibiza/ui";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Acciones, Cifra, Dialogo, Mensaje } from "../componentes/Dialogo";
import type { Vinculacion } from "../db/ajustes";
import { usePagoQr } from "../hooks/usePagoQr";
import { confirmar } from "../lib/alertas";
import estilos from "./PantallaCobroQr.module.css";

type Props = {
  vinculacion: Vinculacion;
  total: number;
  // MP confirmó el pago: la venta se registra con el id de la orden
  onPagado: (ordenId: string) => void;
  // El cajero vio la transferencia en su celular (MP o la API no responden)
  onManual: () => void;
  // Vuelve al carrito sin cobrar
  onVolver: () => void;
};

/*
 * Solo dibuja según el paso de usePagoQr. Registrar la venta e imprimir lo hace
 * useCobrar desde PantallaVenta, igual que con los otros medios de pago.
 */
export function PantallaCobroQr({ vinculacion, total, onPagado, onManual, onVolver }: Props) {
  const { paso, reintentar, generarOtro, cancelar, confirmarManual, cancelando, errorAlCancelar } =
    usePagoQr({ vinculacion, total, onPagado, onManual, onCancelado: onVolver });

  async function confirmarAMano() {
    if (await confirmar("¿Ya viste la transferencia en el celular?", "Sí, cobrar")) confirmarManual();
  }

  const monto = <Cifra prefijo="$">{total.toLocaleString("es-AR")}</Cifra>;

  switch (paso.paso) {
    case "creando":
      return (
        <Dialogo titulo="Transferencia" ayuda="Generando el QR…" tamaño="medio">
          {monto}
          <Acciones>
            <Boton variante="secundario" onClick={cancelar} disabled={cancelando}>
              Cancelar
            </Boton>
          </Acciones>
        </Dialogo>
      );

    case "esperando":
      return (
        <Dialogo titulo="Transferencia" ayuda="El cliente escanea el QR con su app" tamaño="medio">
          {/* Fondo blanco siempre: con el tema oscuro, muchos celulares no leen un QR claro sobre negro */}
          <div className={estilos.qr}>
            <QRCodeSVG value={paso.orden.qrData} size={260} marginSize={4} />
          </div>
          <CuentaRegresiva hasta={paso.orden.venceEn} />
          {monto}
          <Mensaje tipo={errorAlCancelar ? "error" : "aviso"}>
            {errorAlCancelar
              ? "No se pudo cancelar el QR. Si lo pagan igual, la plata entra sin venta."
              : paso.sinConexion
                ? "Sin conexión, reintentando…"
                : "Esperando el pago…"}
          </Mensaje>
          <Acciones>
            {errorAlCancelar ? (
              <Boton variante="secundario" onClick={onVolver} disabled={cancelando}>
                Volver igual
              </Boton>
            ) : null}
            <Boton variante="secundario" onClick={cancelar} disabled={cancelando}>
              {errorAlCancelar ? "Reintentar cancelar" : "Cancelar"}
            </Boton>
            <Boton onClick={confirmarAMano} disabled={cancelando}>
              Confirmar a mano
            </Boton>
          </Acciones>
        </Dialogo>
      );

    case "sinQr":
      return (
        <Dialogo titulo="Transferencia" tamaño="medio">
          {monto}
          <Mensaje>No se pudo generar el QR. Revisá la conexión o confirmá a mano.</Mensaje>
          <Acciones>
            <Boton variante="secundario" onClick={onVolver}>
              Volver
            </Boton>
            <Boton variante="secundario" onClick={reintentar}>
              Reintentar
            </Boton>
            {/* Sin orden no hay QR que cancelar: confirmarManual cobra directo */}
            <Boton onClick={confirmarAMano}>Confirmar a mano</Boton>
          </Acciones>
        </Dialogo>
      );

    case "terminado":
      return (
        <Dialogo
          titulo={paso.motivo === "VENCIDO" ? "El QR venció" : "Se canceló el QR"}
          ayuda="No se cobró nada. Podés generar otro."
          tamaño="medio"
        >
          {monto}
          <Acciones>
            <Boton variante="secundario" onClick={onVolver}>
              Volver
            </Boton>
            <Boton onClick={generarOtro}>Generar otro</Boton>
          </Acciones>
        </Dialogo>
      );

    case "pagado":
      // Dura un instante: PantallaVenta vuelve a la venta apenas recibe onPagado
      return (
        <Dialogo titulo="¡Pago recibido!" tamaño="medio">
          {monto}
        </Dialogo>
      );
  }
}

/*
 * Cuánto le queda al QR. La hora sale de la API (venceEn), así que con el reloj de la
 * caja corrido puede errarle por unos segundos: es orientativo. Al llegar a 0 no cambia
 * de pantalla sola; lo hace el sondeo cuando MP responde que la orden venció.
 */
function CuentaRegresiva({ hasta }: { hasta: string }) {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 1_000);
    return () => clearInterval(intervalo);
  }, []);

  const segundos = Math.max(0, Math.ceil((Date.parse(hasta) - ahora) / 1_000));
  const minutos = Math.floor(segundos / 60);
  const resto = String(segundos % 60).padStart(2, "0");

  return (
    <p className={estilos.vence}>
      {segundos > 0 ? `Vence en ${minutos}:${resto}` : "Venciendo…"}
    </p>
  );
}
