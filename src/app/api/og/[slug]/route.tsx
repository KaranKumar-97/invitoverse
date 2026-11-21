import { ImageResponse } from "next/og";
import { monogram, orderedNames } from "@/lib/invitation/couple";
import { dateParts } from "@/lib/invitation/dates";
import { findPalette } from "@/lib/invitation/manifest";
import { getPublishedInvitationBySlug } from "@/server/services/public-invitations";
import { getManifest } from "@/templates/registry";

const SIZE = { width: 1200, height: 630 };
const latin = (s: string) => /^[\p{Script=Latin}\p{N}\p{P}\p{Zs}&]*$/u.test(s);

/**
 * GET /api/og/{slug}?v={publishedVersion} — 1200×630 link preview (WhatsApp, iMessage, social).
 * Styled from the invitation's own palette. Invitation-level only: never contains guest names.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const inv = await getPublishedInvitationBySlug(slug);
  if (!inv) return new Response("Not found", { status: 404 });

  const manifest = getManifest(inv.templateSlug);
  const palette = manifest
    ? { ...findPalette(manifest, inv.design.paletteId).colors, ...inv.design.paletteOverrides }
    : {
        bg: "#2A0E12",
        surface: "#3B1418",
        text: "#F6E7C8",
        muted: "#CDB78F",
        accent: "#C9A227",
        accentContrast: "#2A0E12",
      };
  const [a, b] = orderedNames(inv.content.couple);
  const d = dateParts(inv.content.weddingDate);
  const royal = manifest?.category === "ROYAL";
  const city = inv.content.city && latin(inv.content.city) ? inv.content.city : "";
  // The default OG font is Latin-only; skip Indic text rather than render empty boxes.
  const names = latin(a) && latin(b) ? `${a} & ${b}` : monogram(inv.content.couple);

  const v = new URL(req.url).searchParams.get("v");
  const cache =
    v === String(inv.publishedVersion)
      ? "public, max-age=31536000, immutable"
      : "public, max-age=60, s-maxage=300";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: palette.bg,
        color: palette.text,
        padding: 36,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: `2px solid ${palette.accent}`,
          borderRadius: royal ? 4 : 0,
          boxShadow: royal
            ? `inset 0 0 0 10px ${palette.bg}, inset 0 0 0 12px ${palette.accent}`
            : "none",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: palette.muted,
          }}
        >
          {royal ? "The wedding of" : "Together with their families"}
        </div>
        <div
          style={{
            display: "flex",
            width: 180,
            height: 2,
            background: palette.accent,
            margin: "28px 0",
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: names.length > 22 ? 76 : 96,
            fontWeight: 700,
            letterSpacing: royal ? 6 : 2,
            textTransform: royal ? "uppercase" : "none",
            color: royal ? palette.accent : palette.text,
            lineHeight: 1.05,
            maxWidth: 1000,
          }}
        >
          {names}
        </div>
        <div
          style={{
            display: "flex",
            width: 180,
            height: 2,
            background: palette.accent,
            margin: "28px 0",
          }}
        />
        <div
          style={{ display: "flex", fontSize: 30, letterSpacing: 8, textTransform: "uppercase" }}
        >{`${d.weekday} · ${d.day} ${d.month} ${d.year}`}</div>
        {city ? (
          <div
            style={{
              display: "flex",
              marginTop: 14,
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: palette.muted,
            }}
          >
            {city}
          </div>
        ) : null}
      </div>
    </div>,
    { ...SIZE, headers: { "Cache-Control": cache, "X-Robots-Tag": "noindex" } },
  );
}
