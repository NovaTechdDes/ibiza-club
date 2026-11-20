import estilos from "./Pestanas.module.css";

type Props<T extends string> = {
    pestanas: readonly { id: T; titulo: string }[];
    elegida: T;
    onElegir: (id: T) => void;
};

// Control segmentado: las pestañas de Catálogo y Reportes.
// Genérico en T: onElegir recibe el mismo tipo de id que tiene la lista (no un string cualquiera).
export function Pestanas<T extends string>({ pestanas, elegida, onElegir }: Props<T>) {
    return (
        <div className={estilos.pestanas} role="group">
            {pestanas.map((pestana) => (
                <button
                    key={pestana.id}
                    type="button"
                    className={estilos.pestana}
                    aria-pressed={pestana.id === elegida}
                    onClick={() => onElegir(pestana.id)}
                >
                    {pestana.titulo}
                </button>
            ))}
        </div>
    );
}
