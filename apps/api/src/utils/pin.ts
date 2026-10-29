import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const LARGO_SALT = 16;
const LARGO_HASH = 64;

export const hashearPin = (pin: string): string => {
    const salt = randomBytes(LARGO_SALT);
    const hash = scryptSync(pin, salt, LARGO_HASH);
    return `${salt.toString("hex")}:${hash.toString("hex")}`;
};

export const verificarPin = (pin: string, pinHash: string): boolean => {
    const [ saltHex, hashHex] = pinHash.split(':');
    if (!saltHex || !hashHex) return false;

    const esperado = Buffer.from(hashHex, 'hex');
    const calculado = scryptSync(pin, Buffer.from(saltHex, 'hex'), esperado.length);
    return timingSafeEqual(calculado, esperado)
};