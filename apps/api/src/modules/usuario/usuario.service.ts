import type { AccesoPanelInput, Rol, UsuarioInput, UsuarioUpdate } from "@ibiza/shared";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../errors/app-error.js";
import { hashearSecreto } from "../../utils/secreto.js";
import { escribirCatalogo } from "../comun/escritura-catalogo.js";

// Lista blanca de campos: pinHash y passwordHash NUNCA salen por la API.
// Del acceso al panel solo se muestra el email (null = no tiene acceso).
const seleccion = {
    id: true,
    nombre: true,
    rol: true,
    activo: true,
    version: true,
    accesoPanel: { select: { email: true } }
} as const;

const ROL_SIN_PANEL: Rol = "CAJERO";

export const listarUsuarios = () => {
    return prisma.usuario.findMany({
        select: seleccion,
        orderBy: [{ activo: 'desc' }, { nombre: 'asc' }]
    })
};

export const obtenerUsuario = async (id: number) => {
    const usuario = await prisma.usuario.findUnique({
        where: { id },
        select: seleccion
    });
    if (!usuario) {
        throw AppError.noEncontrado('Usuario no encontrado')
    }
    return usuario
};

// El nombre no es único (puede haber dos "Juan"), así que acá no hay P2002.
export const crearUsuario = (usuarioId: number, input: UsuarioInput) => {
    const { pin, ...datos } = input;

    // El PIN nunca va al detalle de auditoría.
    return escribirCatalogo(usuarioId, 'USUARIO_CREAR', datos, (tx, version) =>
        tx.usuario.create({ data: { ...datos, pinHash: hashearSecreto(pin), version }, select: seleccion })
    );
};

export const actualizarUsuario = async (usuarioId: number, id: number, input: UsuarioUpdate) => {
    const actual = await obtenerUsuario(id);

    const cambiaRol = input.rol !== undefined && input.rol !== actual.rol;

    // Si un admin se baja el rol a sí mismo puede dejar el sistema sin admin.
    if (cambiaRol && id === usuarioId) {
        throw AppError.conflicto('No podés cambiar tu propio rol');
    }

    // Un cajero no entra al panel: si pasa a cajero se le borra el acceso,
    // para que no quede una contraseña dormida que reviva si lo ascienden de nuevo.
    const quitarAcceso = cambiaRol && input.rol === ROL_SIN_PANEL && actual.accesoPanel !== null;

    return escribirCatalogo(usuarioId, 'USUARIO_ACTUALIZAR', { usuarioId: id, ...input, ...(quitarAcceso && { accesoQuitado: true }) }, async (tx, version) => {
        if (quitarAcceso) {
            await tx.accesoPanel.delete({ where: { usuarioId: id } });
        }

        return tx.usuario.update({
            where: { id },
            data: {
                ...(input.nombre !== undefined && { nombre: input.nombre }),
                ...(input.rol !== undefined && { rol: input.rol }),
                version
            },
            select: seleccion
        });
    });
};

export const cambiarEstadoUsuario = async (usuarioId: number, id: number, activo: boolean) => {
    await obtenerUsuario(id);

    // Quien hace la baja es un admin activo, así que siempre queda al menos uno.
    if (!activo && id === usuarioId) {
        throw AppError.conflicto('No podés darte de baja a vos mismo');
    }

    return escribirCatalogo(usuarioId, activo ? 'USUARIO_ALTA' : 'USUARIO_BAJA', { usuarioId: id, activo }, (tx, version) =>
        tx.usuario.update({ where: { id }, data: { activo, version }, select: seleccion })
    );
};

// Sube la versión: el pinHash nuevo tiene que bajar a las cajas.
export const cambiarPinUsuario = async (usuarioId: number, id: number, pin: string) => {
    await obtenerUsuario(id);

    return escribirCatalogo(usuarioId, 'USUARIO_PIN', { usuarioId: id }, (tx, version) =>
        tx.usuario.update({ where: { id }, data: { pinHash: hashearSecreto(pin), version }, select: seleccion })
    );
};

// ---------------------------------------------------------------
// Acceso al panel (email + contraseña). No sube la versión global:
// AccesoPanel no baja a las cajas. Igual queda auditado.
// ---------------------------------------------------------------

// Crea el acceso o lo reemplaza (sirve también para resetear una contraseña olvidada).
export const asignarAccesoPanel = async (usuarioId: number, id: number, input: AccesoPanelInput) => {
    const usuario = await obtenerUsuario(id);

    if (usuario.rol === ROL_SIN_PANEL) {
        throw AppError.conflicto('Un cajero no puede tener acceso al panel');
    }

    const datos = { email: input.email, passwordHash: hashearSecreto(input.password) };

    try {
        await prisma.$transaction([
            prisma.accesoPanel.upsert({
                where: { usuarioId: id },
                create: { usuarioId: id, ...datos },
                update: datos
            }),
            // Nunca guardar la contraseña ni su hash en el detalle
            prisma.auditoriaPanel.create({
                data: { usuarioId, accion: 'ACCESO_PANEL_ASIGNAR', detalle: JSON.stringify({ usuarioId: id, email: input.email }) }
            })
        ]);
    } catch (error: any) {
        if (error.code === 'P2002') throw AppError.conflicto('Ya existe un acceso con ese email');
        throw error;
    }

    return obtenerUsuario(id);
};

export const quitarAccesoPanel = async (usuarioId: number, id: number) => {
    const usuario = await obtenerUsuario(id);

    // Si un admin se quita su propio acceso puede dejar el panel sin nadie que entre.
    if (id === usuarioId) {
        throw AppError.conflicto('No podés quitarte tu propio acceso');
    }
    if (!usuario.accesoPanel) {
        throw AppError.conflicto('El usuario no tiene acceso al panel');
    }

    await prisma.$transaction([
        prisma.accesoPanel.delete({ where: { usuarioId: id } }),
        prisma.auditoriaPanel.create({
            data: { usuarioId, accion: 'ACCESO_PANEL_QUITAR', detalle: JSON.stringify({ usuarioId: id, email: usuario.accesoPanel.email }) }
        })
    ]);

    return obtenerUsuario(id);
};
