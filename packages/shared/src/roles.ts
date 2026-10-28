export const ROLES = ["CAJERO", "ENCARGADO", "ADMIN"] as const;
export type Rol = (typeof ROLES)[number];
