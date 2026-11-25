import z from "zod";

export const ESTADOS_PAGO_QR = ["PENDIENTE", "PAGADO" , "CANCELADO", "VENCIDO"] as const;

export const CrearOrdenQrSchema =  z.object({
    total: z.number().int().positive(),
    clave: z.uuid()
})

export const OrdenIdSchema = z.string().regex(/^ORD[A-Z0-9]{10,40}$/)

export const OrdenQrSchema = z.object({
    ordenId: z.string().min(1),
    qrData: z.string().min(1),
    venceEn: z.iso.datetime()
});

export const EstadoOrdenQrSchema = z.object({
    estado: z.enum(ESTADOS_PAGO_QR)
})

export type EstadoPagoQr = (typeof ESTADOS_PAGO_QR)[number];
export type CrearOrdenQr = z.infer<typeof CrearOrdenQrSchema>;
export type OrdenQr = z.infer<typeof OrdenQrSchema>
export type EstadoOrdenQr = z.infer<typeof EstadoOrdenQrSchema>