import { Boton, Tarjeta, TecladoNumerico } from "@ibiza/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useApertura } from "../hooks/useApertura";
import { useSesion } from "../stores/sesion";
import { registrarMovimiento } from "../db/movimiento";
import { avisarOperacionNueva } from "../hooks/useSubida";
import estilos from "./PantallaCambioCajero.module.css";




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
        <div className={estilos.pantalla}>
            <Tarjeta className={estilos.tarjeta}>
                <h1 className={estilos.titulo}>Cambio de cajero</h1>
                <p className={estilos.aviso}>Conta el efectivo de la caja (opcional). No vas a ver cuanto deberia haber.</p>
                <p className={estilos.monto}>$ {monto.toLocaleString("es-AR")}</p>
                <p className={estilos.error}>{contar.isError && "No se pudo guardar el conteo"}</p>
                <TecladoNumerico onDigito={teclear} onBorrar={borrar}/>
                <div className={estilos.acciones}>
                    <Boton variante="secundario" disabled={contar.isPending} onClick={onVolver}>
                        Cancelar
                    </Boton>
                    <Boton variante="secundario" disabled={contar.isPending} onClick={salir}>
                        Salir sin contar
                    </Boton>
                    <Boton onClick={() => contar.mutate()} variante="primario" disabled={monto === 0 || contar.isPending}>
                        {contar.isPending ? "Guardando" : "Guardar y salir"}
                    </Boton>
                </div>
            </Tarjeta>
        </div>
    )
}