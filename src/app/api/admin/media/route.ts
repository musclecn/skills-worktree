import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { UserRole } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;

  const data = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
  });

  return ok(data);
}

export async function POST(req: Request) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return fail("file is required", 422);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
  const fileName = `${Date.now()}-${safeName}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, buffer);

  const url = `/uploads/${fileName}`;
  const asset = await prisma.mediaAsset.create({
    data: {
      fileName,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      path: filePath,
      url,
      altZh: String(formData.get("altZh") ?? ""),
      altEn: String(formData.get("altEn") ?? ""),
      createdById: auth.user.id,
    },
  });

  return ok(asset);
}
