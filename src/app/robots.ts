import type { MetadataRoute } from "next";
import { SITE } from "@/lib/marketing/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Live demos are thin duplicates of the detail pages.
        disallow: [
          "/i/",
          "/dashboard",
          "/admin",
          "/preview",
          "/api/",
          "/login",
          "/templates/*/preview",
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
