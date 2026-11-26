import Swal, { type SweetAlertOptions } from "sweetalert2";
import "./alertas.css";

/*
 * Todas las alertas salen de acá con el mismo aspecto. buttonsStyling: false apaga
 * los estilos propios de SweetAlert y customClass le pone nuestras clases (alertas.css),
 * que usan los tokens del tema: así siguen al claro u oscuro sin pasar colores a mano.
 */
const base = (confirmarPeligro: boolean): SweetAlertOptions => ({
  heightAuto: false,
  // El ancho va por opción: SweetAlert lo pone como estilo en línea y le gana al CSS
  width: 440,
  buttonsStyling: false,
  reverseButtons: true,
  customClass: {
    popup: "alerta",
    title: "alerta-titulo",
    htmlContainer: "alerta-texto",
    actions: "alerta-acciones",
    confirmButton: `alerta-boton ${confirmarPeligro ? "alerta-peligro" : "alerta-confirmar"}`,
    cancelButton: "alerta-boton alerta-cancelar",
  },
});

type OpcionesConfirmar = {
  // Rojo solo para lo que borra o da vuelta algo (vaciar, anular). Lo demás, violeta
  peligro?: boolean;
};

export async function confirmar(
  titulo: string,
  textoConfirmar: string,
  { peligro = false }: OpcionesConfirmar = {},
) {
  const { isConfirmed } = await Swal.fire({
    ...base(peligro),
    title: titulo,
    icon: peligro ? "warning" : "question",
    showCancelButton: true,
    confirmButtonText: textoConfirmar,
    cancelButtonText: "Cancelar",
    focusCancel: true,
  });

  return isConfirmed;
}

export async function avisaError(mensaje: string) {
  await Swal.fire({
    ...base(false),
    title: mensaje,
    icon: "error",
    confirmButtonText: "Aceptar",
  });
}

// Para cuando algo falló y se puede volver a intentar. Devuelve true si eligen reintentar
export async function preguntarReintento(
  titulo: string,
  texto: string,
  textoCancelar = "Seguir sin imprimir",
) {
  const { isConfirmed } = await Swal.fire({
    ...base(false),
    title: titulo,
    text: texto,
    icon: "error",
    showCancelButton: true,
    confirmButtonText: "Reintentar",
    cancelButtonText: textoCancelar,
    // Un toque sin querer fuera de la alerta no tiene que decidir por el cajero
    allowOutsideClick: false,
    allowEscapeKey: false,
  });

  return isConfirmed;
}
