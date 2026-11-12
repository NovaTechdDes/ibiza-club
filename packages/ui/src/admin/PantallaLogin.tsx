import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useState, type FormEvent } from "react";
import { Boton } from "../componentes/Boton";
import { CampoTexto } from "../componentes/CampoTexto";
import { Tarjeta } from "../componentes/Tarjeta";
import { mensajeDeError, useApiAdmin } from "./api";
import estilos from "./PantallaLogin.module.css";
import { useSesionAdmin, type UsuarioPanel } from "./sesion";

type RespuestaLogin = { token: string; usuario: UsuarioPanel };

function mensajeLogin(error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 401) return "Email o contraseña incorrectos.";
    if (axios.isAxiosError(error) && error.response?.status === 400) return "Revisá el email.";
    return mensajeDeError(error, "No se pudo iniciar sesión.");
}

type Props = {
    enLinea: boolean;
    // En el escritorio: volver a la venta sin iniciar sesión.
    onVolver?: (() => void) | undefined;
};

export function PantallaLogin({ enLinea, onVolver }: Props) {
    const { api } = useApiAdmin();
    const entrar = useSesionAdmin((estado) => estado.entrar);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const login = useMutation({
        mutationFn: async () => {
            const { data } = await api.post<RespuestaLogin>("/auth/login", { email: email.trim(), password });
            return data;
        },
        onSuccess: ({ token, usuario }) => entrar(token, usuario)
    });

    function enviar(evento: FormEvent) {
        evento.preventDefault();
        login.mutate();
    }

    return (
        <div className={estilos.pantalla}>
            <Tarjeta className={estilos.tarjeta}>
                <h1 className={estilos.titulo}>Administración</h1>
                <p className={estilos.ayuda}>Entrá con tu email y contraseña. El PIN de la caja no sirve acá.</p>

                <form className={estilos.formulario} onSubmit={enviar}>
                    <CampoTexto
                        etiqueta="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="username"
                        spellCheck={false}
                        autoFocus
                    />
                    <CampoTexto
                        etiqueta="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />

                    {!enLinea && <p className={estilos.error}>Sin conexión con el servidor. La administración necesita internet.</p>}
                    {enLinea && login.isError && <p className={estilos.error}>{mensajeLogin(login.error)}</p>}

                    <Boton type="submit" disabled={!email.trim() || !password || login.isPending}>
                        {login.isPending ? "Entrando…" : "Entrar"}
                    </Boton>
                    {onVolver && (
                        <Boton variante="secundario" onClick={onVolver}>
                            Volver a la venta
                        </Boton>
                    )}
                </form>
            </Tarjeta>
        </div>
    );
}
