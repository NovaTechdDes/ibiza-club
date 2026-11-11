import { useState } from 'react'
import { cerrarCaja, type ResultadoCierre } from '../db/cierre';
import { useSesion } from '../stores/sesion';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { CLAVE_APERTURA, useApertura } from '../hooks/useApertura';
import { avisarOperacionNueva } from '../hooks/useSubida';
import { Boton, Tarjeta, TecladoNumerico } from '@ibiza/ui';

import estilos from './PantallaCierre.module.css'
import { PedirPin } from '../componentes/PedirPin';
import type { Usuario } from '../db/usuario';
import type { Rol } from '@ibiza/shared';
import { confirmar } from '../lib/alertas';

const MONTO_MAXIMO = 99_999_999;
const ROLES_AUTORIZAN: Rol[] = ["ENCARGADO", "ADMIN"]

interface Props {
    onVolver: () => void
}

export const PantallaCierre = ({onVolver}: Props) => {
    const queryClient = useQueryClient();
    const [contado, setContado] = useState(0);
    const [pidiendoPin, setPidiendoPin] = useState(false);
    const [resultado, setResultado] = useState<ResultadoCierre | null>(null);
    const salir = useSesion((e) => e.salir);

    const { data: apertura } = useApertura();

    const cerrar = useMutation({
        mutationFn: (encargado: Usuario) => {
            if (!apertura) throw new Error("No hay caja abierta")
            return cerrarCaja({
                aperturaId: apertura.id,
                cerradoPorId: encargado.id,
                contado,
                pendiente: false
            });
        },
        onSuccess: (r) => {
            setResultado(r);
            avisarOperacionNueva(queryClient)
        }
    })
    
    async function pedirConfirmacion() {
        if (await confirmar(`¿Contaste $ ${contado.toLocaleString("es-AR")}?`, "Sí, cerrar"))
            setPidiendoPin(true);
        }

    function teclear(digito: string) {
        cerrar.reset();
        setContado((actual) => {
        const nuevo = actual * 10 + Number(digito);
        return nuevo > MONTO_MAXIMO ? actual : nuevo;
        });
    }

    function borrar() {
        cerrar.reset();
        setContado((actual) => Math.floor(actual / 10));
    }

    async function terminar(){
        salir();
        await queryClient.invalidateQueries({ queryKey: CLAVE_APERTURA})
    }

    if(resultado){
        const r = resultado;
        const claseDif = r.diferencia === 0 ? estilos.exacto : r.diferencia < 0 ? estilos.falta : estilos.sobra;
        const textoDif = r.diferencia === 0 ? "Exacto" : r.diferencia < 0 ? "Faltan" : "Sobran";

        return (
            <div className={estilos.pantalla}>
                <Tarjeta className={estilos.tarjeta}>
                    <h1 className={estilos.titulo}>Caja cerrada</h1>

                     <div className={estilos.filas}>
                        <Fila etiqueta="Fondo" monto={r.fondo} />
                        <Fila etiqueta="Ventas en efectivo" monto={r.efectivo} />
                        <Fila etiqueta="Retiros" monto={-r.retiros} />
                        <Fila etiqueta="Esperado" monto={r.esperado} destacada />
                        <Fila etiqueta="Contado" monto={r.contado} destacada />
                        </div>

                    <p className={`${estilos.diferencia} ${claseDif}`}>
                    {textoDif}
                    {r.diferencia !== 0 && ` $ ${Math.abs(r.diferencia).toLocaleString("es-AR")}`}
                    </p>

                        <div className={estilos.filas}>
                            <Fila etiqueta="Tarjeta" monto={r.tarjeta} />
                            <Fila etiqueta="Transferencia" monto={r.transferencia} />
                            <div className={estilos.fila}>
                                <span>Ventas / Anuladas</span>
                                <span>{r.cantVentas} / {r.cantAnuladas}</span>
                            </div>
                        </div>

                    <div className={`${estilos.acciones} ${estilos.accionUnica}`}>
                    <Boton variante="primario" onClick={terminar}>Terminar</Boton>
                    </div>
                </Tarjeta>
            </div>
        )
    }

    if(pidiendoPin){
        return (
            <PedirPin
                titulo='¿Quién autoriza el cierre?'
                roles={ROLES_AUTORIZAN}
                onCancelar={() => setPidiendoPin(false)}
                onCorrecto={(encargado) => {
                    setPidiendoPin(false);
                    cerrar.mutate(encargado)
                }}
            />
        )
    }
  return (
    <div className={estilos.pantalla}>
        <Tarjeta className={estilos.tarjeta}>
            <h1 className={estilos.titulo}>Cierre de caja</h1>
            <p className={estilos.ayuda}>Contá el efectivo de la caja y cargá el total</p>
            <p className={estilos.monto}>$ {contado.toLocaleString("es-AR")}</p>
            <p className={estilos.error}>{cerrar.isError && (cerrar.error instanceof Error ? cerrar.error.message : "No se pudo cerrar la caja")}</p>
            <TecladoNumerico onDigito={teclear} onBorrar={borrar}/>
             <div className={estilos.acciones}>
                <Boton variante="secundario" disabled={cerrar.isPending} onClick={onVolver}>
                Cancelar
                </Boton>
                <Boton variante="primario" disabled={cerrar.isPending} onClick={pedirConfirmacion}>
                {cerrar.isPending ? "Cerrando" : "Cerrar caja"}
                </Boton>
            </div>
        </Tarjeta>
    </div>
  )
}


const Fila = ({ etiqueta, monto, destacada }: { etiqueta: string; monto: number; destacada?: boolean }) => (
  <div className={`${estilos.fila} ${destacada ? estilos.destacada : ""}`}>
    <span>{etiqueta}</span>
    <span>$ {monto.toLocaleString("es-AR")}</span>
  </div>
);