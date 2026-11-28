import { NextResponse } from "next/server";
import { artUrl, isArtFile } from "@/server/services/template-art";

/**
 * GET /t-art/<slug>/<file> — template art (docs/19 §4.6): redirects to an admin's replacement if
 * there is one, otherwise to the bundled file. Cached briefly so replacements show within minutes.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string; file: string }> },
) {
  const { slug, file } = await params;
  if (!isArtFile(slug, file)) return new NextResponse("Not found", { status: 404 });
  const target = await artUrl(slug, file);
  return NextResponse.redirect(new URL(target, req.url), {
    status: 307,
    headers: { "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600" },
  });
}
