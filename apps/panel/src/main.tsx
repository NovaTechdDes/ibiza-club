import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Administracion } from "@ibiza/ui";
import "@ibiza/ui/tema.css";

const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
if (!apiUrl) {
  throw new Error(
    "Falta VITE_API_URL. En desarrollo va en apps/panel/.env.development",
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Administracion apiUrl={apiUrl} />
    </QueryClientProvider>
  </React.StrictMode>,
);
