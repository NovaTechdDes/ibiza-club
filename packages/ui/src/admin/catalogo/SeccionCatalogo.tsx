import { type ComponentType, useState } from "react";
import { Boton } from "../../componentes/Boton";
import { Categorias } from "./Categorias";
import { Envases } from "./Envases";
import estilos from "./Catalogo.module.css";
import { Productos } from "./Productos";
import { Precios } from "./Precios";

type Pestana = "categorias" | "envases" | "productos" | "precios";

type DatosPestana = {
  id: Pestana;
  titulo: string;
  paso: string;
  // Sin componente se muestra "se arma en el paso…". Para sumar una pestaña, completar este campo.
  componente?: ComponentType;
};

const PESTANAS: readonly DatosPestana[] = [
  {
    id: "categorias",
    titulo: "Categorías",
    paso: "F17a",
    componente: Categorias,
  },
  { id: "envases", titulo: "Envases", paso: "F17b", componente: Envases },
  { id: "productos", titulo: "Productos", paso: "F17c", componente: Productos },
  { id: "precios", titulo: "Precios", paso: "F17d", componente: Precios },
];

export function SeccionCatalogo() {
  const [pestana, setPestana] = useState<Pestana>("categorias");
  const actual = PESTANAS.find((elem) => elem.id === pestana);
  const Contenido = actual?.componente;
  return (
    <div className={estilos.pantalla}>
      <div className={estilos.pestanas}>
        {PESTANAS.map((elem) => (
          <Boton
            aria-pressed={pestana === elem.id}
            key={elem.id}
            variante={pestana === elem.id ? "primario" : "secundario"}
            onClick={() => setPestana(elem.id)}
          >
            {elem.titulo}
          </Boton>
        ))}
      </div>
      {Contenido ? (
        <Contenido />
      ) : (
        <p className={estilos.ayuda}>Se arma en el paso {actual?.paso}.</p>
      )}
    </div>
  );
}
