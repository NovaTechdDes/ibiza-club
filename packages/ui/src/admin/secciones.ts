import type { Rol } from "@ibiza/shared";
import type { ComponentType } from "react";
import { SeccionCatalogo } from "./catalogo/SeccionCatalogo";

export type IdSeccion = "catalogo" | "promociones" | "reportes" | "usuarios" | "cajas";

export type Seccion = {
    id: IdSeccion;
    titulo: string;
    // Quién la ve en el menú. La API valida lo mismo: esto es solo para no mostrar lo que va a dar 403.
    roles: readonly Rol[];
    // Paso de la hoja de ruta donde se escribe la pantalla.
    paso: string;
    // Se completa en los pasos F17 a F20. Sin componente se muestra "en construcción".
    componente?: ComponentType;
};

export const SECCIONES: readonly Seccion[] = [
    { id: "catalogo", titulo: "Catálogo y precios", roles: ["ADMIN", "ENCARGADO"], paso: "F17", componente: SeccionCatalogo },
    { id: "promociones", titulo: "Promociones", roles: ["ADMIN", "ENCARGADO"], paso: "F18" },
    { id: "reportes", titulo: "Reportes", roles: ["ADMIN"], paso: "F19" },
    { id: "usuarios", titulo: "Usuarios", roles: ["ADMIN"], paso: "F20" },
    { id: "cajas", titulo: "Cajas", roles: ["ADMIN"], paso: "F20" },
];

export const seccionesDe = (rol: Rol) => SECCIONES.filter((seccion) => seccion.roles.includes(rol));

export const NOMBRE_ROL: Record<Rol, string> = {
    ADMIN: "Administrador",
    ENCARGADO: "Encargado",
    CAJERO: "Cajero"
};
