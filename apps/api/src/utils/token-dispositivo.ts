import { createHash, randomBytes } from "node:crypto";

export const generarTokenDispositivo = (): string => randomBytes(32).toString('hex');
export const hashearToken = (token: string): string => createHash("sha256").update(token).digest('hex');