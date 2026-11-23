import React from "react";
import ReactDOM from "react-dom/client";

import "@ibiza/ui/tema.css";
import App from "./App";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { VENTANA_CLIENTE } from "./lib/pantallaCliente";
import { useTema } from "@ibiza/ui";
import { PantallaCliente } from "./pantallas/PantallaCliente";

const esCliente = getCurrentWindow().label === VENTANA_CLIENTE;

if (esCliente) {
  document.documentElement.dataset.tema = "oscuro";
  useTema.setState({ tema: "oscuro" });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {esCliente ? (
      <PantallaCliente />
    ) : (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    )}
  </React.StrictMode>,
);
