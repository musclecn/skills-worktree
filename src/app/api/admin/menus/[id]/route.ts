import { UserRole } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const data = await prisma.menu.findUnique({ where: { id } });
  if (!data) return fail("Not found", 404);
  return ok(data);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const data = await prisma.menu.update({
    where: { id },
    data: {
      menuKey: body?.menuKey ? String(body.menuKey) : undefined,
      labelZh: body?.labelZh ? String(body.labelZh) : undefined,
      labelEn: body?.labelEn ? String(body.labelEn) : undefined,
      path: body?.path ? String(body.path) : undefined,
      sortOrder: body?.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
      visible: body?.visible !== undefined ? Boolean(body.visible) : undefined,
    },
  });

  return ok(data);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  await prisma.menu.delete({ where: { id } });
  return ok({ deleted: true });
}
