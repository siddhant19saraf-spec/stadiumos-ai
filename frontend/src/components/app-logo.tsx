import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { container: "size-8", icon: "size-4", text: "text-lg" },
  md: { container: "size-10", icon: "size-5", text: "text-xl" },
  lg: { container: "size-12", icon: "size-6", text: "text-2xl" },
};

export function AppLogo({ className, showText = true, size = "md" }: AppLogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm",
          s.container,
        )}
      >
        <Trophy className={s.icon} />
      </div>
      {showText && <span className={cn("font-bold tracking-tight", s.text)}>StadiumOS AI</span>}
    </div>
  );
}

export function MiniLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm",
        className,
      )}
    >
      <Trophy className="size-4" />
    </div>
  );
}
