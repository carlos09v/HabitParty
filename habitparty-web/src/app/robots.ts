import type { MetadataRoute } from "next";
import { SITE_URL } from "@/i18n/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/en", "/pt-BR", "/signIn", "/signUp"],
        disallow: [
          "/dashboard",
          "/tasks",
          "/focus",
          "/rewards",
          "/inventory",
          "/history",
          "/help",
          "/settings",
          "/admin",
          "/firstStep",
          "/auth/",
          "/verify-email",
          "/reset-password",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
