import estilos from './Interruptores.module.css'

type Props<T extends string | number> = {
    etiqueta: string;
    opciones: readonly { id: T; texto: string}[];
    elegidos: readonly T[];
    onCambiar: (elegidos: T[]) => void;
}

export function Interruptores<T extends string | number>({etiqueta, opciones, elegidos, onCambiar}: Props<T>){
    
    const alternar = (id: T) =>
        onCambiar(elegidos.includes(id) ? elegidos.filter((e) => e !== id) : [...elegidos, id]);
  
    return (
    <div className={estilos.interruptores} role='group' aria-label={etiqueta}>
        {opciones.map((opcion) => (
            <button key={opcion.id} type='button' className={estilos.interruptor} aria-pressed={elegidos.includes(opcion.id)} onClick={() => alternar(opcion.id)}>
                {opcion.texto}
            </button>
        ))}
    </div>
  )
}
