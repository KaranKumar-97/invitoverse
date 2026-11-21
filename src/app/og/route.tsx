import { ImageResponse } from "next/og";

/** GET /og — default 1200×630 social card for studio (marketing) pages. Static and cacheable. */
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#FBF8F3",
        color: "#17130F",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", fontSize: 40, fontWeight: 700 }}>
        {"Vivah"}
        <span style={{ color: "#7A1F2B" }}>.</span>
        <span style={{ marginLeft: 14, fontSize: 22, letterSpacing: 6, color: "#4A433B" }}>
          {"STUDIO"}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 84,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: -3,
            maxWidth: 900,
          }}
        >
          {"Invitations that open like a love letter."}
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: "#4A433B" }}>
          {"Animated wedding invitation websites · Free during beta"}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          height: 10,
          width: 220,
          background: "#7A1F2B",
          borderRadius: 999,
        }}
      />
    </div>,
    { width: 1200, height: 630 },
  );
}
