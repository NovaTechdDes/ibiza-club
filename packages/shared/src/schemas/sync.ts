import z from "zod";
import { LARGO_NOMBRE, TAMANO_LOTE } from "../constantes.js";
import { MEDIOS_PAGO } from "../medio-pago.js";
import { TIPOS_MOVIMIENTO } from "../tipo-movimiento.js";

const Id = z.number().int().positive();
const Plata = z.number().int().min(0);

// CAmpos que tiene toda operacion que nace en una caja
const OperacionBase = z.object({
    idLocal: Id,
    ocurridaEn: z.iso.datetime({ offset: true})
});

const ItemVentaSubidaSchema = z.object({
    varianteId: Id,
    nombre: z.string().trim().min(1).max(150),
    precioUnitario: Plata,
    cantidad: z.number().int().positive(),
    promocionId: Id.nullable().optional(),
    promocionNombre: z.string().max(LARGO_NOMBRE).nullable().optional(),
    descuento: Plata.default(0)
});

export const VentaSubidaSchema = OperacionBase.extend({
    tipo: z.literal('VENTA'),
    aperturaIdLocal: Id,
    numero: z.number().int().positive(),
    cajeroId: Id,
    medioPago: z.enum(MEDIOS_PAGO),
    subTotal: Plata,
    descuento: Plata,
    total: Plata,
    items: z.array(ItemVentaSubidaSchema).min(1),
    }).superRefine((v, ctx) => {
        const subTotal = v.items.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0);
        const descuento = v.items.reduce((s, i) => s + i.descuento, 0);

        if(v.subTotal !== subTotal){
            ctx.addIssue({ code: "custom", path: ["subTotal"], message: `El subtotal deberia ser ${subTotal}`})
        }
        if(v.descuento !== descuento){
            ctx.addIssue({ code: 'custom', path: ["descuento"], message: `El descuento deberia ser ${descuento}`})
        }
        if(v.total !== v.subTotal - v.descuento){
            ctx.addIssue({ code: "custom", path: ["total"], message: "El total no es subtotal - descuento"})
        }
});

export const AperturaSubidaSchema = OperacionBase.extend({
    tipo: z.literal("APERTURA"),
    cajeroId: Id,
    encargadoId: Id,
    fondo: Plata,
    jornada: z.object({
        fecha: z.iso.date(),
        letra: z.string().regex(/^[A-Z]$/)
    }).optional()
});

export const MovimientoSubidaSchema = OperacionBase.extend({
    tipo: z.literal('MOVIMIENTO'),
    aperturaIdLocal: Id,
    monto: Plata,
    motivo: z.string().trim().min(1).max(255).optional(),
    usuarioId: Id,
    autorizoId: Id.optional(),
    tipoMovimiento: z.enum(TIPOS_MOVIMIENTO)
}).superRefine((m, ctx) => {
    if(m.tipoMovimiento === 'RETIRO' && !m.autorizoId){
        ctx.addIssue({ code: 'custom', path: ["autorizoId"], message: "El retiro tiene que ser autorizado"})
    }
    if(m.tipoMovimiento === 'RETIRO' && !m.motivo){
        ctx.addIssue({ code: 'custom', path: ["motivo"], message: "El retiro tiene que tener motivo"})
    }
})

export const AnulacionSubidaSchema = OperacionBase.extend({
    tipo: z.literal('ANULACION'),
    ventaIdLocal: Id,
    encargadoId: Id,
    motivo: z.string().trim().max(255).min(1)
})

export const CierreSubidaSchema = OperacionBase.extend({
    tipo: z.literal('CIERRE'),
    aperturaIdLocal: Id,
    diferencia: z.number().int(),
    cerradoPorId: Id,
    contado: Plata, esperado: Plata,
    totalTarjeta: Plata,
    totalTransferencia: Plata,
    pendiente: z.boolean().default(false)
}).superRefine((c, ctx) => {
    if(c.diferencia !== c.contado - c.esperado){
        ctx.addIssue({ code: 'custom', path: ['diferencia'], message: "La diferencia es distinta de lo que se espera"})
    }
})

export const AuditoriaSubidaSchema = OperacionBase.extend({
    tipo: z.literal('AUDITORIA'),
    usuarioId: Id.optional().nullable(),
    accion: z.string().trim().min(1).max(50),
    detalle: z.string().optional()
})

export const SyncBajadaSchema = z.object({
    desde: z.coerce.number().int().min(0)
});

export type SyncBajada = z.infer<typeof SyncBajadaSchema>

export const OperacionSubidaSchema = z.discriminatedUnion('tipo', [
    AperturaSubidaSchema, VentaSubidaSchema, MovimientoSubidaSchema,
    AnulacionSubidaSchema, CierreSubidaSchema, AuditoriaSubidaSchema
]);

export const SyncSubidaSchema = z.object({
    operaciones: z.array(OperacionSubidaSchema).min(1).max(TAMANO_LOTE)
});

export type OperacionSubida = z.infer<typeof OperacionSubidaSchema>
export type SyncSubida = z.infer<typeof SyncSubidaSchema>;
