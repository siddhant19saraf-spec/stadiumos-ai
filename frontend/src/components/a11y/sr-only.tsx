import type { ReactNode } from "react";

export function SrOnly({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

export function VisuallyHidden({ children, as: Tag = "span", ...props }: { children: ReactNode; as?: "span" | "div" } & Record<string, unknown>) {
  return <Tag className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0" style={{ clip: "rect(0,0,0,0)" }} {...props}>{children}</Tag>;
}
