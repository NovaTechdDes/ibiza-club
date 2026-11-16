import {
  fechaOperativa,
  type RangoReporte,
  RangoReporteQuerySchema,
} from "@ibiza/shared";
import { type ComponentType, useState } from "react";
import { Boton } from "../../componentes/Boton";
import { CampoTexto } from "../../componentes/CampoTexto";
import estilos from "./Reportes.module.css";
import { VentasPorCaja } from "./VentasPorCaja";
import { VentasPorMedio } from "./VentasPorMedio";

type Pestana = "medio-pago" | "caja" | "promo" | "arqueo" | "sincronizacion";

// Unión discriminada: usaRango decide la forma de componente.
// Con rango recibe las fechas ya validadas; sin rango (Sincronización) no recibe nada.
type DatosPestana = { id: Pestana; titulo: string; paso: string } & (
  | { usaRango: true; componente?: ComponentType<{ rango: RangoReporte }> }
  | { usaRango: false; componente?: ComponentType }
);

const PESTANAS: readonly DatosPestana[] = [
  {
    id: "medio-pago",
    titulo: "Medios de pago",
    paso: "F19b",
    usaRango: true,
    componente: VentasPorMedio,
  },
  {
    id: "caja",
    titulo: "Cajas",
    paso: "F19b",
    usaRango: true,
    componente: VentasPorCaja,
  },
  {
    id: "promo",
    titulo: "Promos",
    paso: "F19c",
    usaRango: true,
  },
  {
    id: "arqueo",
    titulo: "Arqueos",
    paso: "F19d",
    usaRango: true,
  },
  {
    id: "sincronizacion",
    titulo: "Sincronización",
    paso: "F19e",
    usaRango: false,
  },
];

export function Reportes() {
  const ultimaJornada = fechaOperativa(new Date());

  const [pestana, setPestana] = useState<Pestana>("medio-pago");
  const [desde, setDesde] = useState(ultimaJornada);
  const [hasta, setHasta] = useState(ultimaJornada);

  const actual = PESTANAS.find((elem) => elem.id === pestana);

  const resultado = RangoReporteQuerySchema.safeParse({
    desde,
    hasta: hasta || undefined,
  });

  // Qué va debajo del selector. Separado del JSX para no anidar ternarios.
  const contenido = () => {
    if (!actual) return null;
    const enConstruccion = (
      <p className={estilos.ayuda}>Se arma en el paso {actual.paso}.</p>
    );

    if (!actual.usaRango) {
      // Acá TypeScript ya sabe que componente no lleva props
      const Contenido = actual.componente;
      return Contenido ? <Contenido /> : enConstruccion;
    }

    // El error va antes que "en construcción": así se puede probar ya, con las pestañas vacías
    if (!resultado.success) {
      return (
        <p className={estilos.error}>{resultado.error.issues[0]?.message}</p>
      );
    }

    // Acá sabe que lleva rango y que resultado.data es un RangoReporte válido
    const Contenido = actual.componente;
    return Contenido ? <Contenido rango={resultado.data} /> : enConstruccion;
  };

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
      {actual?.usaRango && (
        <div className={estilos.rango}>
          <CampoTexto
            etiqueta="Desde"
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
          <CampoTexto
            etiqueta="Hasta"
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />

          <Boton
            variante="secundario"
            onClick={() => {
              setDesde(ultimaJornada);
              setHasta(ultimaJornada);
            }}
          >
            Ultima jornada
          </Boton>
        </div>
      )}

      {contenido()}
    </div>
  );
}
