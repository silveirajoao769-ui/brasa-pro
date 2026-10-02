import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://brasa-pro.vercel.app";

  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: baseUrl + "/termos",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: baseUrl + "/privacidade",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];
}
