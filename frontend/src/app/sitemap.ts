import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://stadiumos-ai.vercel.app";
  return [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/command-center`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/ai-copilot`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/crowd-intelligence`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/emergency-response`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/executive-analytics`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/parking`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/digital-twin`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/energy`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/enterprise-security`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/sustainability`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/scheduling`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/fan-assistant`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/maintenance`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];
}
