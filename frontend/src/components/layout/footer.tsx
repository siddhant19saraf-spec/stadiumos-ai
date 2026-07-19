import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { APP_NAME } from "@/constants";

const footerLinks = {
  Platform: [
    { label: "Stadium Command Center", href: "/command-center" },
    { label: "AI Stadium Copilot", href: "#" },
    { label: "Crowd Intelligence", href: "/crowd-intelligence" },
    { label: "Executive Decision Support", href: "/executive-analytics" },
  ],
  Solutions: [
    { label: "Stadium Emergency Response", href: "/emergency-response" },
    { label: "Smart Parking & Traffic", href: "/parking" },
    { label: "Stadium Energy & Sustainability", href: "/energy" },
    { label: "Stadium Security Operations", href: "/enterprise-security" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Privacy Policy", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/">
              <AppLogo size="sm" />
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs">
              Enterprise-grade AI platform for smart stadium and tournament operations.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold">{title}</h4>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">Built for Hack2Sustain 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
