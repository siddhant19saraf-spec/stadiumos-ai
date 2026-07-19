"use client";

import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { Sun, Moon, Bell, Menu, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mockUser = { name: "Admin User", email: "admin@stadiumos.ai", image: null };

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { theme, toggleTheme, setMobileMenuOpen } = useUIStore();
  const session = { user: mockUser };

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6"
      role="banner"
    >
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {title && (
        <h1 className="text-lg font-semibold text-foreground" aria-current="page">
          {title}
        </h1>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="User menu">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image ?? undefined} alt={session?.user?.name ?? "User"} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{session?.user?.name ?? "User"}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {session?.user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

