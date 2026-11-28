import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

/**
 * GET /og — default 1200×630 social card for studio (marketing) pages, styled like the home hero:
 * serif headline with gold-foil "love letter.", tagline, and the three hero phones.
 * Static: rendered once at build time (reads fonts and posters from disk).
 */
export const dynamic = "force-static";

const INK = "#17130F";
const INK_SOFT = "#4A433B";
const MUTED = "#736B62";
const FOIL = "linear-gradient(100deg, #8A6224, #B8873B 40%, #D9B467 60%, #8A6224)";

/** Same templates and order as the hero (src/components/marketing/home/Hero.tsx). */
const PHONES = [
  { slug: "mandir", left: 10, top: 104, width: 200, tilt: -10 },
  { slug: "royal-heritage", left: 250, top: 122, width: 192, tilt: 8 },
  { slug: "meenakshi", left: 116, top: 58, width: 222, tilt: -4 },
] as const;

const fromRoot = (...p: string[]) => path.join(process.cwd(), ...p);

async function dataUri(file: string, type: string) {
  return `data:${type};base64,${(await readFile(file)).toString("base64")}`;
}

export async function GET() {
  const [serif, serifItalic, sans, ...posters] = await Promise.all([
    readFile(fromRoot("src/app/og/fonts/Fraunces-Medium.ttf")),
    readFile(fromRoot("src/app/og/fonts/Fraunces-Italic.ttf")),
    readFile(fromRoot("src/app/og/fonts/Inter-Regular.ttf")),
    ...PHONES.map((p) => dataUri(fromRoot("public/templates", p.slug, "poster.jpg"), "image/jpeg")),
  ]);

  const foil = {
    fontFamily: "Fraunces",
    fontStyle: "italic" as const,
    fontWeight: 400,
    backgroundImage: FOIL,
    backgroundClip: "text",
    color: "transparent",
    paddingRight: 6,
  };

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "#FBF8F3",
        color: INK,
        fontFamily: "Inter",
        overflow: "hidden",
      }}
    >
      {/* Warm glow behind the phones, as in the hero */}
      <div
        style={{
          position: "absolute",
          top: -260,
          right: -200,
          width: 900,
          height: 900,
          display: "flex",
          borderRadius: 9999,
          backgroundImage:
            "radial-gradient(circle, rgba(231,199,123,0.4) 0%, rgba(231,199,123,0) 70%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 690,
          padding: "60px 0 60px 72px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontFamily: "Fraunces",
            fontWeight: 500,
            fontSize: 36,
            letterSpacing: -0.5,
          }}
        >
          {`${BRAND.lead}`}
          {BRAND.accent ? (
            <span style={{ ...foil, marginLeft: 10 }}>{`${BRAND.accent}`}</span>
          ) : (
            <span style={{ color: "#B8873B" }}>.</span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Fraunces",
              fontWeight: 500,
              fontSize: 70,
              lineHeight: 1.08,
              letterSpacing: -1.6,
            }}
          >
            <div style={{ display: "flex" }}>{"Invitations that open"}</div>
            <div style={{ display: "flex" }}>
              <span style={{ marginRight: 16 }}>{"like a"}</span>
              <span style={foil}>{"love letter."}</span>
            </div>
          </div>
          <div
            style={{ marginTop: 26, fontSize: 27, lineHeight: 1.4, color: INK_SOFT, maxWidth: 560 }}
          >
            {"Designer, animated invitation websites — personalized for every guest."}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", fontSize: 22, color: MUTED }}>
          <div
            style={{
              display: "flex",
              width: 44,
              height: 4,
              marginRight: 16,
              borderRadius: 999,
              backgroundImage: FOIL,
            }}
          />
          {"Free during beta · No app needed · Ready in minutes"}
        </div>
      </div>

      <div style={{ display: "flex", position: "relative", flex: 1 }}>
        {PHONES.map((p, i) => (
          <div
            key={p.slug}
            style={{
              position: "absolute",
              left: p.left,
              top: p.top,
              width: p.width,
              height: Math.round((p.width * 844) / 390),
              display: "flex",
              padding: 6,
              borderRadius: 34,
              background: INK,
              border: "1.5px solid rgba(184,135,59,0.75)",
              boxShadow: "0 30px 60px -20px rgba(23,19,15,0.45)",
              transform: `rotate(${p.tilt}deg)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders plain <img> */}
            <img
              src={posters[i]}
              alt=""
              width={p.width - 12}
              height={Math.round((p.width * 844) / 390) - 12}
              style={{ borderRadius: 28, objectFit: "cover" }}
            />
          </div>
        ))}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Fraunces", data: serif, weight: 500, style: "normal" },
        { name: "Fraunces", data: serifItalic, weight: 400, style: "italic" },
        { name: "Inter", data: sans, weight: 400, style: "normal" },
      ],
    },
  );
}
