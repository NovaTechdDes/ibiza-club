import { Boton } from "./Boton";
import { IconoBorrar } from "./Iconos";
import estilos from "./TecladoNumerico.module.css";

const DIGITOS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

type TecladoNumericoProps = {
  onDigito: (digito: string) => void;
  onBorrar: () => void;
};

// No guarda estado: lo tecleado es de quien lo usa (PIN, montos, etc.)
export function TecladoNumerico({ onDigito, onBorrar }: TecladoNumericoProps) {
  return (
    <div className={estilos.teclado}>
      {DIGITOS.map((digito) => (
        <Boton
          key={digito}
          variante="secundario"
          className={estilos.tecla}
          onClick={() => onDigito(digito)}
        >
          {digito}
        </Boton>
      ))}

      <Boton
        variante="secundario"
        className={`${estilos.tecla} ${estilos.cero}`}
        onClick={() => onDigito("0")}
      >
        0
      </Boton>
      {/* Solo ícono: el aria-label le da nombre al botón */}
      <Boton
        variante="secundario"
        className={estilos.tecla}
        onClick={onBorrar}
        aria-label="Borrar"
      >
        <IconoBorrar tamaño={28} />
      </Boton>
    </div>
  );
}
