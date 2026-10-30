import z from "zod";

export const SyncBajadaSchema = z.object({
    desde: z.coerce.number().int().min(0)
});

export type SyncBajada = z.infer<typeof SyncBajadaSchema>