import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants";
import { SkipLink } from "@/lib/a11y/skip-link";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: `${APP_NAME} – Autonomous Stadium Operations Platform`,
  },
  description:
    "Enterprise-grade AI platform for autonomous stadium and tournament operations monitoring, prediction, and optimization.",
  keywords: [
    "stadium",
    "AI",
    "operations",
    "crowd management",
    "smart stadium",
    "tournament",
  ],
  authors: [{ name: "StadiumOS AI" }],
  robots: { index: true, follow: true },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <SkipLink />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
