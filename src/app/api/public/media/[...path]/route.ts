import path from "node:path";
import { readFile } from "node:fs/promises";

const CONTENT_TYPE_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
};

function getMimeType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return CONTENT_TYPE_MAP[ext] ?? "application/octet-stream";
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const uploadRoot = path.resolve(path.join(process.cwd(), "public", "uploads"));
  const { path: parts } = await params;

  if (!Array.isArray(parts) || parts.length === 0) {
    return new Response("Not Found", { status: 404 });
  }

  const decodedParts = parts.map((part) => decodeURIComponent(part));
  const targetPath = path.resolve(uploadRoot, ...decodedParts);

  if (targetPath !== uploadRoot && !targetPath.startsWith(`${uploadRoot}${path.sep}`)) {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    const buffer = await readFile(targetPath);
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": getMimeType(targetPath),
        "Cache-Control": "public, max-age=604800",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
