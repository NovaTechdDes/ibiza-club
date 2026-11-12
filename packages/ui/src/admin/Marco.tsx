import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Boton } from "../componentes/Boton";
import { useApiAdmin } from "./api";
import estilos from "./Marco.module.css";
import { NOMBRE_ROL, seccionesDe, type IdSeccion } from "./secciones";
import { useSesionAdmin, type UsuarioPanel } from "./sesion";

type Props = {
    usuario: UsuarioPanel;
    enLinea: boolean;
    // En el escritorio: cierra la sesión y vuelve a la venta (F22).
    onVolver?: (() => void) | undefined;
};

// Marco de la administración: menú según el rol a la izquierda, sección elegida a la derecha.
export function Marco({ usuario, enLinea, onVolver }: Props) {
    const { api } = useApiAdmin();
    const salir = useSesionAdmin((estado) => estado.salir);
    const actualizarUsuario = useSesionAdmin((estado) => estado.actualizarUsuario);

    // El usuario guardado puede estar viejo (un F5 horas después, o le cambiaron el rol).
    // /auth/yo lo refresca; si el token ya no sirve responde 401 y el cliente cierra la sesión.
    const yo = useQuery({
        queryKey: ["admin", "yo", usuario.id],
        queryFn: async () => (await api.get<UsuarioPanel>("/auth/yo")).data,
        staleTime: 60_000,
        retry: false
    });
    useEffect(() => {
        if (yo.data) actualizarUsuario(yo.data);
    }, [yo.data, actualizarUsuario]);

    const secciones = seccionesDe(usuario.rol);
    const [elegida, setElegida] = useState<IdSeccion | null>(null);
    // Si le sacaron el rol que habilitaba la sección abierta, cae en la primera que le quede.
    const actual = secciones.find((seccion) => seccion.id === elegida) ?? secciones[0];
    const Contenido = actual?.componente;

    return (
        <div className={estilos.marco}>
            <aside className={estilos.lateral}>
                <div className={estilos.marca}>
                    <strong>Ibiza Club</strong>
                    <span>Administración</span>
                </div>

                <nav className={estilos.menu} aria-label="Secciones">
                    {secciones.map((seccion) => (
                        <button
                            key={seccion.id}
                            type="button"
                            className={`${estilos.item} ${seccion.id === actual?.id ? estilos.itemActivo : ""}`}
                            aria-current={seccion.id === actual?.id ? "page" : undefined}
                            onClick={() => setElegida(seccion.id)}
                        >
                            {seccion.titulo}
                        </button>
                    ))}
                </nav>

                <div className={estilos.pie}>
                    <div className={estilos.usuario}>
                        <strong>{usuario.nombre}</strong>
                        <span>{NOMBRE_ROL[usuario.rol]}</span>
                    </div>
                    {onVolver ? (
                        <Boton variante="secundario" onClick={onVolver}>
                            Volver a la venta
                        </Boton>
                    ) : (
                        <Boton variante="secundario" onClick={salir}>
                            Cerrar sesión
                        </Boton>
                    )}
                </div>
            </aside>

            <main className={estilos.contenido}>
                {!enLinea && (
                    <div className={estilos.aviso} role="alert">
                        <strong>Sin conexión con el servidor.</strong> Los cambios no se pueden guardar hasta que vuelva internet.
                    </div>
                )}

                <header className={estilos.encabezado}>
                    <h1>{actual?.titulo ?? "Administración"}</h1>
                </header>

                <section className={estilos.seccion}>
                    {Contenido ? (
                        <Contenido />
                    ) : (
                        <p className={estilos.vacio}>
                            {actual ? `Esta pantalla se arma en el paso ${actual.paso}.` : "Tu usuario no tiene secciones habilitadas."}
                        </p>
                    )}
                </section>
            </main>
        </div>
    );
}
