"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MODULE_CATEGORIES, APP_NAME } from "@/constants";
import { MODULES } from "@/constants/modules";
import { useUIStore } from "@/stores/ui-store";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard: Icons.LayoutDashboard,
  Users: Icons.Users,
  Siren: Icons.Siren,
  Calendar: Icons.Calendar,
  Car: Icons.Car,
  Clock: Icons.Clock,
  Bot: Icons.Bot,
  Globe: Icons.Globe,
  Wrench: Icons.Wrench,
  Zap: Icons.Zap,
  UsersRound: Icons.UsersRound,
  Search: Icons.Search,
  BarChart3: Icons.BarChart3,
  Settings: Icons.Settings,
  Brain: Icons.Brain,
  Shield: Icons.Shield,
  Heart: Icons.Heart,
  Sparkles: Icons.Sparkles,
  FileText: Icons.FileText,
  Gauge: Icons.Gauge,
  Leaf: Icons.Leaf,
  Accessibility: Icons.Accessibility,
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebar, toggleSidebar } = useUIStore();
  const isCollapsed = sidebar === "collapsed";

  return (
    <aside
      aria-label="Main navigation"
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className={cn("flex h-14 items-center border-b px-4", isCollapsed && "justify-center")}>
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
            <Icons.LayoutDashboard className="h-6 w-6 text-sidebar-primary" />
            <span className="text-sm">{APP_NAME}</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn("ml-auto h-8 w-8", isCollapsed && "ml-0")}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icons.PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2" role="navigation" aria-label="Module navigation">
        {MODULE_CATEGORIES.map((category) => {
          const categoryModules = MODULES.filter((m) => m.category === category.id);
          if (categoryModules.length === 0) return null;

          const CategoryIcon = iconMap[category.icon] ?? Icons.Circle;

          return (
            <div key={category.id} className="mb-4">
              {!isCollapsed && (
                <div className="mb-1 flex items-center gap-2 px-2 py-1">
                  <CategoryIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {category.label}
                  </span>
                </div>
              )}
              <ul className="space-y-0.5" role="list">
                {categoryModules.map((module) => {
                  const Icon = iconMap[module.icon] ?? Icons.Circle;
                  const isActive = pathname?.startsWith(module.route);

                  return (
                    <li key={module.id}>
                      <Link
                        href={module.route}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                          isCollapsed && "justify-center px-2",
                        )}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={isCollapsed ? module.name : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 truncate">{module.name}</span>
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                module.status === "connected" && "bg-emerald-500",
                                module.status === "disconnected" && "bg-gray-400",
                                module.status === "error" && "bg-red-500",
                                module.status === "loading" && "animate-pulse-dot bg-amber-500",
                              )}
                              aria-label={`Status: ${module.status}`}
                            />
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
