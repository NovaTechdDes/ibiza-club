import Swal from "sweetalert2";
import './alertas.css'

export async function confirmar(titulo: string, textoConfirmar: string) {
    const { isConfirmed } = await Swal.fire({
        title: titulo,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: textoConfirmar,
        cancelButtonText: "Cancelar",
        reverseButtons: true,
        focusCancel: true,
        heightAuto: false,
        background: "var(--color-superficie)",
        confirmButtonColor: "var(--color-peligro)",
        cancelButtonColor: "var(--color-superficie-alta)",
        color: "var(--color-texto)"
    });

    return isConfirmed;


};

export async function avisaError(mensaje: string) {
    await Swal.fire({
        title: mensaje,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        heightAuto: false,
        background: "var(--color-superficie)",
        confirmButtonColor: "var(--color-peligro)",
        color: "var(--color-texto)"
    });
};

// Para cuando algo falló y se puede volver a intentar. Devuelve true si eligen reintentar
export async function preguntarReintento(titulo: string, texto: string) {
    const { isConfirmed } = await Swal.fire({
        title: titulo,
        text: texto,
        icon: 'error',
        showCancelButton: true,
        confirmButtonText: 'Reintentar',
        cancelButtonText: 'Seguir sin ticket',
        reverseButtons: true,
        // Un toque sin querer fuera de la alerta no tiene que decidir por el cajero
        allowOutsideClick: false,
        allowEscapeKey: false,
        heightAuto: false,
        background: "var(--color-superficie)",
        confirmButtonColor: "var(--color-acento)",
        cancelButtonColor: "var(--color-superficie-alta)",
        color: "var(--color-texto)"
    });

    return isConfirmed;
};
