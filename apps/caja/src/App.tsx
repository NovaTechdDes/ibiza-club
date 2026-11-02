import { MEDIOS_PAGO } from "@ibiza/shared";
import { Boton, Tarjeta } from "@ibiza/ui";

export default function App() {
  return (
    <main>
      <Tarjeta>
        <h1>Ibiza Cajas</h1>
      </Tarjeta>
      {MEDIOS_PAGO.map((m) => (
        <Boton key={m}>{m}</Boton>
      ))}
      <Boton variante="secundario">Vaciar</Boton>
      <Boton variante="peligro" disabled>
        Anular
      </Boton>
    </main>
  );
}
