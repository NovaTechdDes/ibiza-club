import axios from 'axios'
import estilos from './PantallaVincular.module.css'
import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pedirCaja } from '../lib/api';
import { guardarVinculacion } from '../db/ajustes';
import { CLAVE_VINCULACION } from '../hooks/useVinculacion';
import { Boton, CampoTexto, Tarjeta } from '@ibiza/ui';


function mensajeDeError(error: unknown){
    if(!axios.isAxiosError(error)) return "No se pudo guardar la vinculación."
    if(!error.response) return 'No se pudo conectar. Revisá la URL y el internet.';
    if (error.response.status === 401) return "El token no es válido o fue revocado."

    return `La API respondió con un error (${error.response.status})`;
};

export function PantallaVincular(){
    const [apiUrl, setApiUrl] = useState("");
    const [token, setToken] = useState("");
    const queryClient = useQueryClient();

    const vincular = useMutation({
        mutationFn: async() => {
            //Sacamos la barra final: la url se concatena con /api
            const url = apiUrl.trim().replace(/\/+$/, "");
            const tokenLimpio = token.trim();

            // Primero se valida contra la nube: un token malo nunca llega a guardarse
            const caja = await pedirCaja(url, tokenLimpio);
            const vinculacion = {apiUrl: url, token: tokenLimpio, cajaNombre: caja.nombre};
            await guardarVinculacion(vinculacion)
            return vinculacion;
        },
        onSuccess: (vinculacion) => {
            queryClient.setQueryData(CLAVE_VINCULACION, vinculacion)
        }
    });

    function enviar(evento: FormEvent){
        evento.preventDefault();
        vincular.mutate();
    }

    return (
        <div className={estilos.pantalla}>
            <Tarjeta className={estilos.tarjeta}>
                <h1 className={estilos.titulo}>Vincular esta PC</h1>
                <form className={estilos.formulario} onSubmit={enviar}>
                    <CampoTexto etiqueta='URL de la API' value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        spellCheck={false}
                        autoComplete='off'
                    />
                    <CampoTexto etiqueta='Token de la caja' value={token} onChange={(e) => setToken(e.target.value)} spellCheck={false} autoComplete='off'/>
                    {vincular.isError && (
                        <p className={estilos.error}>{mensajeDeError(vincular.error)}</p>
                    )}
                    <Boton type='submit' disabled={!apiUrl.trim() || !token.trim() || vincular.isPending}>
                        {vincular.isPending ? 'Vinculando...' : 'Vincular'}
                    </Boton>
                </form>
            </Tarjeta>
        </div>
    )
}