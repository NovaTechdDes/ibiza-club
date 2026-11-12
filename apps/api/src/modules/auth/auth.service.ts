import type { Rol } from "@ibiza/shared";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../errors/app-error.js";
import { firmarToken } from "../../utils/jwt.js";
import { hashearSecreto, verificarSecreto } from "../../utils/secreto.js";

const ROLES_PANEL: readonly Rol[] = ["ADMIN", "ENCARGADO"];
const HASH_FALSO = hashearSecreto("no-existe-este-usuario");

const credencialesInvalidas = () => new AppError(401, 'NO_AUTORIZADO', 'Credenciales inválidas');

export const loginPanel = async(email: string, password: string) => {
    const acceso = await prisma.accesoPanel.findUnique({
        where: {email},
        include: {usuario: true}
    })

    const passwordOk = verificarSecreto(password, acceso?.passwordHash ?? HASH_FALSO);

    if (!acceso || !passwordOk) throw credencialesInvalidas();

    const { usuario } = acceso;
    if(!usuario.activo || !ROLES_PANEL.includes(usuario.rol as Rol)){
        throw credencialesInvalidas()
    }

    return {
        token: firmarToken(usuario.id, usuario.rol as Rol),
        usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, email: acceso.email}
    }
}

export const obtenerYo = async (usuarioId: number) => {
    const usuario = await prisma.usuario.findUnique({
        where: {id: usuarioId},
        include: {accesoPanel: true}
    });

    if(!usuario) throw AppError.noEncontrado();

    return {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
        email: usuario.accesoPanel?.email
    }
}

// Cambia la contraseña del propio usuario. Pide la actual para que un token
// robado (o una sesión abierta en otra PC) no alcance para quedarse con la cuenta.
export const cambiarPassword = async (usuarioId: number, actual: string, nueva: string) => {
    const acceso = await prisma.accesoPanel.findUnique({ where: { usuarioId } });
    if (!acceso) throw AppError.noEncontrado();

    if (!verificarSecreto(actual, acceso.passwordHash)) {
        // 400 y no 401: el token es válido, lo que está mal es el dato.
        throw new AppError(400, 'VALIDACION', 'La contraseña actual no es correcta');
    }

    await prisma.$transaction([
        prisma.accesoPanel.update({ where: { usuarioId }, data: { passwordHash: hashearSecreto(nueva) } }),
        prisma.auditoriaPanel.create({ data: { usuarioId, accion: 'PASSWORD_CAMBIAR' } })
    ]);
}
