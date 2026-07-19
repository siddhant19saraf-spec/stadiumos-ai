"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import type { StadiumZone } from "../types";

interface SearchBarProps {
  zones: StadiumZone[];
  onSelect: (zoneId: string) => void;
  className?: string;
}

export function SearchBar({ zones, onSelect, className }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = query.length >= 2
    ? zones.filter((z) =>
        z.name.toLowerCase().includes(query.toLowerCase()) ||
        z.id.toLowerCase().includes(query.toLowerCase()) ||
        z.type.toLowerCase().includes(query.toLowerCase()),
      ).slice(0, 8)
    : [];

  const handleSelect = useCallback((zoneId: string) => {
    onSelect(zoneId);
    setQuery("");
    setFocused(false);
  }, [onSelect]);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search zones..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          className="h-9 w-full rounded-md border bg-background pl-8 pr-8 text-xs outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
          aria-label="Search stadium zones"
        />
        {query && (
          <button
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {focused && query.length >= 2 && (
        <div className="absolute top-full z-20 mt-1 w-full rounded-md border bg-popover py-1 shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">No zones found</p>
          ) : (
            results.map((zone) => (
              <button
                key={zone.id}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs transition-colors hover:bg-muted/50"
                onClick={() => handleSelect(zone.id)}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[8px] uppercase text-muted-foreground">
                  {zone.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-card-foreground">{zone.name}</p>
                  <p className="text-[10px] text-muted-foreground">{zone.type.replace(/_/g, " ")} &middot; Level {zone.level}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
