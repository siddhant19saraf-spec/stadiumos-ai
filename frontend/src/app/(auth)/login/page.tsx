"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLogo } from "@/components/app-logo";
import { toast } from "@/hooks/use-toast";
import { Loader2, Trophy } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Login failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
        return;
      }

      router.push("/");
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full border border-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[400px] rounded-full border border-primary/5" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <AppLogo size="lg" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to StadiumOS Smart Stadium Platform
          </p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <form onSubmit={onSubmit}>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@stadiumos.ai"
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                    Forgot password?
                  </span>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="p-6 pt-0">
              <Button className="w-full" type="submit" disabled={isLoading} size="lg">
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Sign in
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Trophy className="size-3" />
          <span>Built for Hack2Sustain 2026</span>
        </div>
      </div>
    </div>
  );
}
