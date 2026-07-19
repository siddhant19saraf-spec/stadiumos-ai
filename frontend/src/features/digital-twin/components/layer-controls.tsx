"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import type { LayerConfig } from "../types";

interface LayerControlsProps {
  layers: LayerConfig[];
  onToggle: (id: string) => void;
  className?: string;
}

export function LayerControls({ layers, onToggle, className }: LayerControlsProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Data Layers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/20"
            onClick={() => onToggle(layer.id)}
            role="switch"
            aria-checked={layer.enabled}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(layer.id); } }}
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded" style={{ backgroundColor: layer.color, opacity: layer.enabled ? 0.7 : 0.3 }}>
              {layer.enabled ? <Eye className="h-3 w-3 text-white" /> : <EyeOff className="h-3 w-3 text-white" />}
            </div>
            <Label className="flex-1 cursor-pointer text-xs font-normal text-card-foreground">
              {layer.label}
            </Label>
            <Switch
              checked={layer.enabled}
              onCheckedChange={() => onToggle(layer.id)}
              className="h-4 w-7"
              aria-label={`Toggle ${layer.label}`}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
