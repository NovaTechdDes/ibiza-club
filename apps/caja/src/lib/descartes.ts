import { ItemQuitado, useCarrito } from "../stores/carrito";
import { registrarAuditoria } from "../db/auditoria";

export const subtotal = (lista: ItemQuitado[]) =>
    lista.reduce((suma, i) => suma + i.precio * i.cantidad, 0);

export const descartarCarrito = (usuarioId: number) => {
    const { items, quitados, vaciar } = useCarrito.getState();
    if (items.length === 0 && quitados.length === 0) return;

    const enCarrito: ItemQuitado[] = items.map((i) => ({
        varianteId: i.varianteId,
        nombre: i.nombre,
        envaseNombre: i.envaseNombre,
        precio: i.precio,
        cantidad: i.cantidad,
    }));

    vaciar();
    registrarAuditoria({
        accion: "CARRITO_VACIADO",
        usuarioId,
        detalle: {
            items: enCarrito,
            quitados,
            total: subtotal(enCarrito) + subtotal(quitados)
        },
    }).catch(console.error);
};