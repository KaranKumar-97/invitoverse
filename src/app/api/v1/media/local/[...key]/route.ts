import { readFile, stat } from "node:fs/promises";
import {
  LOCAL_CONTENT_TYPES,
  isValidLocalKey,
  localPath,
} from "@/server/integrations/storage/local";

/** Serves local dev uploads (with Range support so audio/video can seek). Not used in production. */
export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const key = (await params).key.join("/");
  if (!isValidLocalKey(key)) return new Response("Not found", { status: 404 });
  let size: number;
  try {
    size = (await stat(localPath(key))).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const type = LOCAL_CONTENT_TYPES[key.split(".").pop() ?? ""] ?? "application/octet-stream";
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
  const data = await readFile(localPath(key));
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size)
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(data.subarray(start, end + 1), {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": String(end - start + 1),
      },
    });
  }
  return new Response(data, { headers: { ...headers, "Content-Length": String(size) } });
}
