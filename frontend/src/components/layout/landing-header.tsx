"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/constants";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Platform", href: "#features" },
  { label: "Documentation", href: "#" },
];

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            S
          </div>
          <span className="text-lg font-bold">{APP_NAME}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/command-center">
            <Button size="sm">Launch Dashboard</Button>
          </Link>
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      <div
        className={cn(
          "md:hidden border-t border-border/40 bg-background px-6 pb-4 pt-2 space-y-3",
          mobileOpen ? "block" : "hidden",
        )}
      >
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        <div className="flex gap-2 pt-2">
          <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
            <Button variant="outline" className="w-full" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/command-center" className="flex-1" onClick={() => setMobileOpen(false)}>
            <Button className="w-full" size="sm">
              Launch Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
