import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./hooks/use-auth";
import { ThemeProvider } from "./components/ui/theme-provider";
import { TenantProvider } from "./hooks/use-tenant-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

// Reversed provider order with AuthProvider before TenantProvider
// This solves the circular dependency problem
// Create a reference for the setTenant function
let setTenantFunction: ((tenant: any) => void) | null = null;

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="okr-theme">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TenantProvider
          onProviderReady={(setTenantFn) => {
            // Store the setTenant function for future use
            setTenantFunction = setTenantFn;
            
            // Expose it globally for debugging purposes
            (window as any).__setTenant = setTenantFn;
          }}
        >
          <App />
          <Toaster />
        </TenantProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);
