import type { Rol } from "@ibiza/shared";
import type { Usuario } from "../db/usuario";

export const ROLES_AUTORIZAN: Rol[] = ["ENCARGADO", "ADMIN"];


export function puedeAutorizar(usuario: Usuario | null, roles: Rol[] = ROLES_AUTORIZAN): usuario is Usuario{
    return usuario !== null && roles.includes(usuario.rol)
}