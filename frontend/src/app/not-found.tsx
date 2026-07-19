import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/constants";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg font-bold mb-6">
        S
      </div>
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="mt-2 text-muted-foreground text-center max-w-sm">
        Page not found. The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-6 flex gap-4">
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
        <Link href="/command-center">
          <Button variant="outline">Dashboard</Button>
        </Link>
      </div>
      <p className="mt-12 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} {APP_NAME}
      </p>
    </div>
  );
}
