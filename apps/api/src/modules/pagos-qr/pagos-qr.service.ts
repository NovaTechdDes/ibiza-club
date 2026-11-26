import { randomUUID } from "node:crypto";
import z from "zod";
import type { EstadoOrdenQr, EstadoPagoQr, OrdenQr } from "@ibiza/shared";
import { env } from "../../config/env.js";
import { AppError } from "../../errors/app-error.js";
import { logger } from "../../config/logger.js";

const API_MP = "https://api.mercadopago.com";
const MINUTOS_VENCIMIENTO = 10;
const CATEGORIA_POS = 621102;

// Solo los campos que usamos: si MP agrega otros, no nos rompe.
const ordenMpSchema = z.object({
    id: z.string(),
    status: z.string(),
    external_reference: z.string(),
    type_response: z.object({ qr_data: z.string() }).optional(),
});
type OrdenMp = z.infer<typeof ordenMpSchema>;

type Pedido = { metodo?: "GET" | "POST"; body?: unknown; idempotencia?: string };

const pedirMp = (ruta: string, { metodo = "GET", body, idempotencia }: Pedido = {}) => {
    const headers: Record<string, string> = { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (idempotencia) headers["X-Idempotency-Key"] = idempotencia;

    return fetch(`${API_MP}${ruta}`, {
        method: metodo,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
    });
};

// MP explica el error en el cuerpo (ej. "store ... not found"). Va al log para
// diagnosticar, pero no a la caja: el cajero no puede hacer nada con eso.
// `cuerpo` es para cuando ya se leyó: una Response se puede leer una sola vez.
const errorMp = async (res: Response, accion: string, cuerpo?: string) => {
    const respuesta = (cuerpo ?? (await res.text().catch(() => ""))).slice(0, 2000);
    logger.warn({ accion, status: res.status, respuesta }, "Mercado Pago respondió con error");
    return new AppError(502, "INTERNO", `Mercado Pago respondió ${res.status}`);
};

// safeParse y no parse: un ZodError acá saldría como 400 (culpa de la caja) y es culpa de MP.
const leerOrden = async (res: Response): Promise<OrdenMp> => {
    const resultado = ordenMpSchema.safeParse(await res.json());
    if (!resultado.success) {
        logger.warn({ issues: resultado.error.issues }, "Respuesta inesperada de Mercado Pago");
        throw new AppError(502, "INTERNO", "Respuesta inesperada de Mercado Pago");
    }
    return resultado.data;
};

const ESTADO_MP: Record<string, EstadoPagoQr> = {
    created: "PENDIENTE",
    processed: "PAGADO",
    expired: "VENCIDO",
    canceled: "CANCELADO",
    refunded: "CANCELADO",
};

// Un estado que no conocemos se toma como pendiente: la caja sigue esperando y la orden vence sola.
const estadoDe = (orden: OrdenMp): EstadoPagoQr => ESTADO_MP[orden.status] ?? "PENDIENTE";

const externalPosId = (cajaId: number) => `IBIZA${cajaId}`;
const prefijoReferencia = (cajaId: number) => `C${cajaId}-`;

const crearCajaMp = async (cajaId: number) => {
    const id = externalPosId(cajaId);
    const res = await pedirMp("/pos", {
        metodo: "POST",
        body: { name: id, store_id: Number(env.MP_STORE_ID), external_id: id, fixed_amount: true, category: CATEGORIA_POS },
        idempotencia: randomUUID(),
    });
    // 409 = ya existía (la creó otro pedido): sirve igual.
    if (!res.ok && res.status !== 409) throw await errorMp(res, "crear caja");
    await res.body?.cancel();
};

const pedirOrdenNueva = (cajaId: number, total: number, clave: string, idempotencia: string) =>
    pedirMp("/v1/orders", {
        metodo: "POST",
        idempotencia,
        body: {
            type: "qr",
            total_amount: String(total),
            external_reference: `${prefijoReferencia(cajaId)}${clave}`,
            expiration_time: `PT${MINUTOS_VENCIMIENTO}M`,
            config: { qr: { external_pos_id: externalPosId(cajaId), mode: "dynamic" } },
            transactions: { payments: [{ amount: String(total) }] },
        },
    });

export const crearOrden = async (cajaId: number, total: number, clave: string): Promise<OrdenQr> => {
    let res = await pedirOrdenNueva(cajaId, total, clave, clave);

    // La primera vez que esta caja cobra con QR, MP no la conoce: se crea y se reintenta una vez.
    if (res.status === 404) {
        const cuerpo = await res.text();
        if (!cuerpo.includes("pos_not_found")) throw await errorMp(res, "crear orden", cuerpo);
        await crearCajaMp(cajaId);
        res = await pedirOrdenNueva(cajaId, total, clave, randomUUID());
    }
    if (!res.ok) throw await errorMp(res, "crear orden");

    const orden = await leerOrden(res);
    if (!orden.type_response) throw new AppError(502, "INTERNO", "Mercado Pago no devolvió el QR");

    return {
        ordenId: orden.id,
        qrData: orden.type_response.qr_data,
        venceEn: new Date(Date.now() + MINUTOS_VENCIMIENTO * 60_000).toISOString(),
    };
};

const buscarOrden = async (cajaId: number, ordenId: string): Promise<OrdenMp> => {
    const res = await pedirMp(`/v1/orders/${ordenId}`);
    if (res.status === 404) throw AppError.noEncontrado("Orden no encontrada");
    if (!res.ok) throw await errorMp(res, "consultar orden");

    const orden = await leerOrden(res);
    // Una caja solo ve sus órdenes. 404 y no 403, para no confirmar que la orden existe.
    if (!orden.external_reference.startsWith(prefijoReferencia(cajaId))) {
        throw AppError.noEncontrado("Orden no encontrada");
    }
    return orden;
};

export const consultarOrden = async (cajaId: number, ordenId: string): Promise<EstadoOrdenQr> => ({
    estado: estadoDe(await buscarOrden(cajaId, ordenId)),
});

export const cancelarOrden = async (cajaId: number, ordenId: string): Promise<EstadoOrdenQr> => {
    const orden = await buscarOrden(cajaId, ordenId);
    if (estadoDe(orden) !== "PENDIENTE") return { estado: estadoDe(orden) };

    const res = await pedirMp(`/v1/orders/${ordenId}/cancel`, { metodo: "POST", idempotencia: randomUUID() });
    // 409: el cliente está pagando justo ahora, o ya cambió. No se adivina: se vuelve a preguntar.
    if (!res.ok && res.status !== 409) throw await errorMp(res, "cancelar orden");
    await res.body?.cancel();

    return consultarOrden(cajaId, ordenId);
};