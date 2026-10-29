import { prisma } from "../../db/prisma.js";
import { AppError } from "../../errors/app-error.js";
import { firmarToken } from "../../utils/jwt.js";
import { verificarPin } from "../../utils/pin.js";

const credencialesInvalidas = () => new AppError(401, 'NO_AUTORIZADO', 'Credenciales inválidas');

export const loginAdmin = async (usuarioId: number, pin: string) => {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });

    // Mismo error en todos los casos: no revelar si el usuario existe
    if (!usuario || !usuario.activo || usuario.rol !== 'ADMIN') {
        throw credencialesInvalidas();
    }
    if (!verificarPin(pin, usuario.pinHash)) {
        throw credencialesInvalidas();
    }

    return {
        token: firmarToken(usuario.id),
        usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol }
    };
};
