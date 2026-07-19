import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/api/", "/login"] },
    ],
    sitemap: "https://stadiumos-ai.vercel.app/sitemap.xml",
  };
}
