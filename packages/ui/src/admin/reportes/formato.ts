export const pesos = (monto: number) => `$ ${monto.toLocaleString("es-AR")}`;

export const porcentaje = (parte: number, total: number) => 
    total === 0 ? "-" : `${Math.round((parte / total) * 100)} %`;


export const fechaHora =(iso: string) => {
    return new Date(iso).toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    })
}

export const haceCuanto = (iso: string | null) => {
    if(iso === null) return "—"

    const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)


    if (minutos < 1){
        return 'recién'
    }

    if(minutos < 60) {
        return `hace ${minutos} min`
    }

    return fechaHora(iso)
}