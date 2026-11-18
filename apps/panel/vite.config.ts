import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // @ibiza/ui se importa como código fuente y trae estas librerías como peer:
  // sin dedupe podrían cargarse dos copias y la de ui no vería el QueryClientProvider del panel.
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-query", "zustand", "axios"],
  },

  // Puerto fijo: http://localhost:5173 es el que está en CORS_ORIGENES de la API.
  // Si estuviera ocupado, mejor que falle a que Vite se mude a otro puerto y CORS lo rechace.
  server: {
    port: 5173,
    strictPort: true,
  },
});
