/// <reference types="vite/client" />

// Variables que Vite expone en import.meta.env (solo las que empiezan con VITE_).
interface ImportMetaEnv {
  // URL base de la API, sin /api. Opcional a propósito: si falta, main.tsx corta con un error claro.
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
