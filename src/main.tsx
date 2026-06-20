import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "./features/auth/context/AuthContext";
import App from "./App";
import "./style.css";

if (localStorage.getItem("butcherista-theme") === "dark") {
  document.documentElement.classList.add("dark");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster richColors position="top-left" />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
