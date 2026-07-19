import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants";
import { SkipLink } from "@/lib/a11y/skip-link";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://stadiumos-ai.vercel.app"),
  title: {
    template: `%s | ${APP_NAME}`,
    default: `${APP_NAME} – Autonomous Stadium Operations Platform`,
  },
  description:
    "Enterprise-grade AI platform for autonomous stadium and tournament operations monitoring, prediction, and optimization. Powered by multi-provider AI with automatic failover.",
  keywords: [
    "stadium",
    "AI",
    "operations",
    "crowd management",
    "smart stadium",
    "tournament",
    "sustainability",
    "energy optimization",
    "emergency response",
    "predictive maintenance",
    "digital twin",
    "FIFA World Cup",
    "sports technology",
    "Hack2Sustain",
  ],
  authors: [{ name: "StadiumOS AI" }],
  creator: "StadiumOS AI Team",
  publisher: "StadiumOS AI",
  robots: { index: true, follow: true },
  openGraph: {
    title: "StadiumOS AI — Autonomous Stadium Operations Platform",
    description:
      "Enterprise-grade AI platform for autonomous stadium and tournament operations monitoring, prediction, and optimization.",
    url: "https://stadiumos-ai.vercel.app",
    siteName: "StadiumOS AI",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "StadiumOS AI — Autonomous Stadium Operations Platform",
    description:
      "Enterprise-grade AI platform for autonomous stadium and tournament operations monitoring, prediction, and optimization.",
  },
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
