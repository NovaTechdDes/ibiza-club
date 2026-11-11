import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const LARGO_SALT = 16;
const LARGO_HASH = 64;

export const hashearSecreto = (secreto: string): string => {
    const salt = randomBytes(LARGO_SALT);
    const hash = scryptSync(secreto, salt, LARGO_HASH);
    return `${salt.toString("hex")}:${hash.toString("hex")}`;
};

export const verificarSecreto = (secreto: string, hash: string): boolean => {
    const [ saltHex, hashHex] = hash.split(':');
    if (!saltHex || !hashHex) return false;

    const esperado = Buffer.from(hashHex, 'hex');
    const calculado = scryptSync(secreto, Buffer.from(saltHex, 'hex'), esperado.length);
    return timingSafeEqual(calculado, esperado)
};