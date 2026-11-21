import type { MetadataRoute } from "next";
import { SITE } from "@/lib/marketing/site";
import { TEMPLATE_SLUGS } from "@/templates/registry";

/** Public studio pages only — invitations, previews and the dashboard are never listed. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${SITE.url}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority,
  });
  return [
    page("/", 1),
    page("/templates", 0.9),
    ...TEMPLATE_SLUGS.map((slug) => page(`/templates/${slug}`, 0.8)),
    page("/about", 0.5),
    page("/contact", 0.5),
    page("/terms", 0.2),
    page("/privacy", 0.2),
  ];
}
