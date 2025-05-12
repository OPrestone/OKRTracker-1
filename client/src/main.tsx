import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./hooks/use-auth";
import { ThemeProvider } from "./components/ui/theme-provider";
import { TenantProvider } from "./hooks/use-tenant-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="okr-theme">
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <AuthProvider>
          <App />
          <Toaster />
        </AuthProvider>
      </TenantProvider>
    </QueryClientProvider>
  </ThemeProvider>
);
