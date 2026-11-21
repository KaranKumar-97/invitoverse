/** Dimensions from image headers (PNG, JPEG, GIF, WebP) without decoding. Null if unknown. */
export function imageSize(buf: Uint8Array): { width: number; height: number; mime: string } | null {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const ascii = (o: number, n: number) => String.fromCharCode(...buf.subarray(o, o + n));
  if (buf.length >= 24 && buf[0] === 0x89 && ascii(1, 3) === "PNG") {
    return { width: dv.getUint32(16), height: dv.getUint32(20), mime: "image/png" };
  }
  if (buf.length >= 10 && ascii(0, 3) === "GIF") {
    return { width: dv.getUint16(6, true), height: dv.getUint16(8, true), mime: "image/gif" };
  }
  if (buf.length >= 30 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    const chunk = ascii(12, 4);
    if (chunk === "VP8X")
      return {
        width: 1 + (dv.getUint32(24, true) & 0xffffff),
        height: 1 + (dv.getUint32(27, true) & 0xffffff),
        mime: "image/webp",
      };
    if (chunk === "VP8 ")
      return {
        width: dv.getUint16(26, true) & 0x3fff,
        height: dv.getUint16(28, true) & 0x3fff,
        mime: "image/webp",
      };
    if (chunk === "VP8L") {
      const b = dv.getUint32(21, true);
      return { width: 1 + (b & 0x3fff), height: 1 + ((b >> 14) & 0x3fff), mime: "image/webp" };
    }
  }
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let o = 2;
    while (o + 9 < buf.length) {
      if (buf[o] !== 0xff) return null;
      const marker = buf[o + 1];
      const len = dv.getUint16(o + 2);
      // SOF0..SOF15 except DHT(C4), JPG(C8), DAC(CC)
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: dv.getUint16(o + 5), width: dv.getUint16(o + 7), mime: "image/jpeg" };
      }
      o += 2 + len;
    }
  }
  return null;
}

/** Magic-byte sniffing for the containers we accept (rejects renamed files). */
export function sniffMime(buf: Uint8Array): string | null {
  const ascii = (o: number, n: number) => String.fromCharCode(...buf.subarray(o, o + n));
  const img = imageSize(buf);
  if (img) return img.mime;
  if (buf.length >= 12 && ascii(4, 4) === "ftyp") {
    const brand = ascii(8, 4);
    if (/^(heic|heix|mif1|msf1|hevc)/.test(brand)) return "image/heic";
    if (/^avif/.test(brand)) return "image/avif";
    if (/^(M4A |M4B )/.test(brand)) return "audio/mp4";
    if (/^qt  /.test(brand)) return "video/quicktime";
    return "video/mp4";
  }
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3)
    return "video/webm";
  if (buf.length >= 3 && (ascii(0, 3) === "ID3" || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0))) {
    return buf[0] === 0xff && (buf[1] & 0xf6) === 0xf0 ? "audio/aac" : "audio/mpeg";
  }
  return null;
}
