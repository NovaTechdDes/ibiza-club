import React from "react";
import ReactDOM from "react-dom/client";

import "@ibiza/ui/tema.css";
import { Administracion } from "@ibiza/ui";
import App from "./App";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Vista previa de la administración, SOLO en desarrollo (F16): abrir
// http://localhost:1420/#admin en el navegador con `pnpm --filter @ibiza/caja dev`.
// No pasa por SQLite ni por Tauri. En F22 se reemplaza por el acceso desde el menú lateral.
const vistaAdmin = import.meta.env.DEV && window.location.hash === "#admin";
const API_DESARROLLO = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {vistaAdmin ? <Administracion apiUrl={API_DESARROLLO} /> : <App />}
    </QueryClientProvider>
  </React.StrictMode>,
);
