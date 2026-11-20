import { Boton, TecladoNumerico } from "@ibiza/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useApertura } from "../hooks/useApertura";
import { useSesion } from "../stores/sesion";
import { registrarMovimiento } from "../db/movimiento";
import { avisarOperacionNueva } from "../hooks/useSubida";
import { Acciones, Cifra, Dialogo, Mensaje } from "../componentes/Dialogo";




interface Props {
    onVolver: () => void;
}

const MONTO_MAXIMO = 99_999_999;

export const PantallaCambioCajero = ({onVolver}: Props) => {
    const queryClient = useQueryClient();
    const { data: apertura} = useApertura();
    const usuario = useSesion((e) => e.usuario);
    const salir = useSesion((e) => e.salir);

    const [monto, setMonto] = useState(0);
    

    const contar = useMutation({
        mutationFn: async () => {
            if(!apertura || !usuario) throw new Error("Falta la apertura o el cajero");
            await registrarMovimiento({
                tipo: "CONTEO_PARCIAL",
                aperturaId: apertura.id,
                monto, 
                motivo: null,
                usuarioId: usuario.id,
                autorizoId: null
            });
        },
        onSuccess: () => {
            avisarOperacionNueva(queryClient);
            salir();
        }
    });

    

    function teclear(digito: string) {
        contar.reset();
        setMonto((actual) => {
        const nuevo = actual * 10 + Number(digito);
        return nuevo > MONTO_MAXIMO ? actual : nuevo;
        });
    }

    function borrar() {
        contar.reset();
        setMonto((actual) => Math.floor(actual / 10));
    }

    return (
        <Dialogo
            titulo="Cambio de cajero"
            ayuda="Contá el efectivo de la caja (opcional). No vas a ver cuánto debería haber."
        >
            <Cifra prefijo="$">{monto.toLocaleString("es-AR")}</Cifra>
            <Mensaje>{contar.isError && "No se pudo guardar el conteo"}</Mensaje>
            <TecladoNumerico onDigito={teclear} onBorrar={borrar} />
            {/* Si no entran los 3 en una fila, "Guardar y salir" baja y queda ancho */}
            <Acciones>
                <Boton variante="secundario" disabled={contar.isPending} onClick={onVolver}>
                    Cancelar
                </Boton>
                <Boton variante="secundario" disabled={contar.isPending} onClick={salir}>
                    Salir sin contar
                </Boton>
                <Boton onClick={() => contar.mutate()} disabled={monto === 0 || contar.isPending}>
                    {contar.isPending ? "Guardando..." : "Guardar y salir"}
                </Boton>
            </Acciones>
        </Dialogo>
    );
};
