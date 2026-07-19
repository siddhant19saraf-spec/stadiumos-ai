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
    default: `${APP_NAME} – Smart Stadium AI Operations Platform`,
  },
  description:
    "Enterprise-grade AI platform purpose-built for FIFA World Cup, tournaments, and smart stadium operations — crowd intelligence, match-day logistics, security, energy sustainability, and emergency response.",
  keywords: [
    "smart stadium",
    "stadium AI",
    "tournament operations",
    "FIFA World Cup",
    "crowd management",
    "match-day operations",
    "stadium security",
    "stadium sustainability",
    "energy optimization",
    "emergency response",
    "predictive maintenance",
    "digital twin",
    "sports technology",
    "Hack2Sustain",
    "stadium operations",
  ],
  authors: [{ name: "StadiumOS AI" }],
  creator: "StadiumOS AI Team",
  publisher: "StadiumOS AI",
  robots: { index: true, follow: true },
  openGraph: {
    title: "StadiumOS AI — Smart Stadium AI Operations Platform",
    description:
      "Enterprise-grade AI platform for FIFA World Cup, tournaments, and smart stadium operations — unifying crowd intelligence, security, energy, and emergency response.",
    url: "https://stadiumos-ai.vercel.app",
    siteName: "StadiumOS AI",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "StadiumOS AI — Smart Stadium AI Operations Platform",
    description:
      "Enterprise-grade AI platform for FIFA World Cup, tournaments, and smart stadium operations.",
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
