"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ShellProps {
  children: ReactNode;
  title?: string;
}

export function Shell({ children, title }: ShellProps) {
  const { sidebar, mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const isCollapsed = sidebar === "collapsed";

  return (
    <div className="relative min-h-screen bg-background">
      {isMobile ? (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-14 items-center justify-between px-4 border-b">
              <span className="font-semibold">Navigation</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Sidebar />
          </SheetContent>
        </Sheet>
      ) : (
        <Sidebar />
      )}

      <div
        className={cn(
          "transition-all duration-300",
          isMobile ? "ml-0" : isCollapsed ? "ml-16" : "ml-64",
        )}
      >
        <Header title={title} />
        <main
          id="main-content"
          className="p-4 lg:p-6"
          role="main"
          aria-label="Page content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
