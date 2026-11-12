import { useState } from "react";
import { Boton } from "../../componentes/Boton";
import { Categorias } from "./Categorias";
import estilos from "./Catalogo.module.css";
type Pestana = "categorias" | "envases" | "productos" | "precios";

const PESTANAS: readonly { id: Pestana; titulo: string; paso: string }[] = [
  { id: "categorias", titulo: "Categorías", paso: "F17a" },
  { id: "envases", titulo: "Envases", paso: "F17b" },
  { id: "productos", titulo: "Productos", paso: "F17c" },
  { id: "precios", titulo: "Precios", paso: "F17d" },
];

export function SeccionCatalogo() {
  const [pestana, setPestana] = useState<Pestana>("categorias");
  const actual = PESTANAS.find((elem) => elem.id === pestana);
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
      {pestana === "categorias" ? (
        <Categorias />
      ) : (
        <p className={estilos.ayuda}>Se arma en el paso {actual?.paso}.</p>
      )}
    </div>
  );
}
