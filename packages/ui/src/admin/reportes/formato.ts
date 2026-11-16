export const pesos = (monto: number) => `$ ${monto.toLocaleString("es-AR")}`;

export const porcentaje = (parte: number, total: number) => 
    total === 0 ? "-" : `${Math.round((parte / total) * 100)} %`;


