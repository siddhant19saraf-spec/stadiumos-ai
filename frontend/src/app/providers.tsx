"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { CACHE } from "@/constants";
import { AnnouncerProvider } from "@/lib/a11y/announcer";
import { ToastContainer } from "@/components/a11y/toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE.STALE_TIME,
      gcTime: CACHE.GC_TIME,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <AnnouncerProvider>
          {children}
          <Toaster />
          <ToastContainer />
        </AnnouncerProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
