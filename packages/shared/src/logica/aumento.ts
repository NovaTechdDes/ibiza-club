export const aplicarAumento = (precio: number, porcentaje: number): number => {
    if(porcentaje === 0) return precio;

    return Math.ceil(precio * (100 + porcentaje) / 10000) * 100;
}