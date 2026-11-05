import { MedioPago } from "@ibiza/shared";
import { useMutation } from "@tanstack/react-query";
import { registrarVenta } from "../db/ventas";
import { useApertura } from "./useApertura";
import { useSesion } from "../stores/sesion";
import { useCarritoCalculado } from "./useCarritoCalculado";

import { useCarrito } from "../stores/carrito";
import { avisaError } from "../lib/alertas";


export const useCobrar = () => {
    const {data: apertura} = useApertura()
    const usuario  = useSesion((estado) => estado.usuario)
    const venta = useCarritoCalculado()
    const vaciar = useCarrito(estado => estado.vaciar);

    
    return useMutation({
       mutationFn: (medioPago: MedioPago) => {

            if(!apertura || !usuario) throw new Error('Error al crear la venta')

            return registrarVenta({...venta, medioPago, aperturaId: apertura.id,cajeroId: usuario.id})
        },
        onSuccess: () => {
            vaciar()
        },
        onError: () => {
            avisaError("Error al crear la venta")
        }
    })
}