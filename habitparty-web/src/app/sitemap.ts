import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";
import { SITE_URL } from "@/i18n/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("static");

  const lastModified = new Date();
  const landingAlternates = {
    languages: {
      en: `${SITE_URL}/en`,
      "pt-BR": `${SITE_URL}/pt-BR`,
    },
  };

  return [
    {
      url: `${SITE_URL}/en`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: landingAlternates,
    },
    {
      url: `${SITE_URL}/pt-BR`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: landingAlternates,
    },
    {
      url: `${SITE_URL}/signIn`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/signUp`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
