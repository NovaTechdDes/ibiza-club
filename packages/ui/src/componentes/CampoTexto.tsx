import type { InputHTMLAttributes } from "react";
import estilos from './CampoTexto.module.css'

type CampoTextoProps = InputHTMLAttributes<HTMLInputElement> & {
    etiqueta: string;
};

export function CampoTexto({ etiqueta, className = "", ...resto}: CampoTextoProps){
    return (
        <label className={`${estilos.campo} ${className}`}>
            <span className={estilos.etiqueta}>{etiqueta}</span>
            <input className={estilos.input} {...resto} />
        </label>
    )
}