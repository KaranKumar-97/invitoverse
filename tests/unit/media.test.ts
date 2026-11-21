// @vitest-environment node
import { describe, expect, it, beforeAll } from "vitest";
import { validateFile } from "@/lib/media";
import { isAllowedMediaUrl } from "@/lib/invitation/urls";
import { signCloudinaryParams } from "@/server/integrations/storage/cloudinary";
import { imageSize, sniffMime } from "@/server/integrations/storage/image-size";
import { signLocalToken, verifyLocalToken } from "@/server/integrations/storage/local";
import { makeJpegHeader, makePng } from "../fixtures/images";

beforeAll(() => {
  process.env.AUTH_SECRET = "unit-test-secret";
});

describe("image headers", () => {
  it("reads PNG and JPEG dimensions", () => {
    expect(imageSize(makePng(640, 480))).toEqual({ width: 640, height: 480, mime: "image/png" });
    expect(imageSize(makeJpegHeader(3000, 2000))).toEqual({
      width: 3000,
      height: 2000,
      mime: "image/jpeg",
    });
  });

  it("sniffs real types and rejects junk", () => {
    expect(sniffMime(makePng(2, 2))).toBe("image/png");
    expect(sniffMime(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
  });
});

describe("validateFile", () => {
  it("enforces type and size per kind", () => {
    expect(validateFile("IMAGE", "image/jpeg", 1000)).toBeNull();
    expect(validateFile("IMAGE", "image/svg+xml", 1000)).toMatch(/Unsupported/);
    expect(validateFile("IMAGE", "image/jpeg", 16 * 1024 * 1024)).toMatch(/too large/);
    expect(validateFile("AUDIO", "audio/mpeg", 0)).toMatch(/empty/);
    expect(validateFile("VIDEO", "video/mp4", 99 * 1024 * 1024)).toBeNull();
  });
});

describe("Cloudinary signature", () => {
  it("matches the documented algorithm (sorted params + secret, sha1)", () => {
    // Example from Cloudinary's docs: public_id=sample_image&timestamp=1315060510 + abcd
    expect(signCloudinaryParams({ timestamp: 1315060510, public_id: "sample_image" }, "abcd")).toBe(
      "b4ad47fb4e25c7bf5f92a20089f9db59bc302313",
    );
  });
});

describe("local upload tokens", () => {
  const claims = {
    key: "vivah/user1/inv1/abcdefghijkl.png",
    kind: "IMAGE" as const,
    mimeType: "image/png",
    maxBytes: 100,
    exp: Date.now() + 60_000,
  };

  it("round-trips", () => expect(verifyLocalToken(signLocalToken(claims))).toEqual(claims));

  it("rejects tampering, expiry and path tricks", () => {
    const t = signLocalToken(claims);
    const [body, mac] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ ...claims, maxBytes: 1e9 })).toString("base64url");
    expect(verifyLocalToken(`${forged}.${mac}`)).toBeNull();
    // Flip the first signature character (always to a different one, or the "tamper" is a no-op).
    expect(verifyLocalToken(`${body}.${mac[0] === "x" ? "y" : "x"}${mac.slice(1)}`)).toBeNull();
    expect(verifyLocalToken(signLocalToken({ ...claims, exp: Date.now() - 1 }))).toBeNull();
    expect(
      verifyLocalToken(signLocalToken({ ...claims, key: "vivah/../../etc/passwd.png" })),
    ).toBeNull();
  });
});

describe("media URL allow-list", () => {
  it("accepts local dev URLs but not traversal", () => {
    expect(isAllowedMediaUrl("/api/v1/media/local/vivah/u/i/abcdefghijkl.png")).toBe(true);
    expect(isAllowedMediaUrl("/api/v1/media/local/../secrets")).toBe(false);
  });
});
