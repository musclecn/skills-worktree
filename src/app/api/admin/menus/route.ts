import { UserRole } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const data = await prisma.menu.findMany({ orderBy: { sortOrder: "asc" } });
  return ok(data);
}

export async function POST(req: Request) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  if (!body?.menuKey || !body?.labelZh || !body?.labelEn || !body?.path) {
    return fail("Missing fields", 422);
  }

  const data = await prisma.menu.create({
    data: {
      menuKey: String(body.menuKey),
      labelZh: String(body.labelZh),
      labelEn: String(body.labelEn),
      path: String(body.path),
      sortOrder: Number(body.sortOrder ?? 0),
      visible: Boolean(body.visible ?? true),
    },
  });
  return ok(data);
}
