import { UserRole } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { hashPassword } from "@/lib/auth/password";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([UserRole.ADMIN]);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail("Invalid payload", 422);

  const data = await prisma.user.update({
    where: { id },
    data: {
      name: body.name ? String(body.name) : undefined,
      email: body.email ? String(body.email).toLowerCase() : undefined,
      role: body.role && [UserRole.ADMIN, UserRole.EDITOR].includes(body.role as UserRole)
        ? (body.role as UserRole)
        : undefined,
      passwordHash: body.password ? await hashPassword(String(body.password)) : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return ok(data);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([UserRole.ADMIN]);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const me = auth.user;
  if (me.id === id) {
    return fail("Cannot delete current user", 422);
  }

  await prisma.user.delete({ where: { id } });
  return ok({ deleted: true });
}
