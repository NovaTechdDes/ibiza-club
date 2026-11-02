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


}