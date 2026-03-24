import { UserRole } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { hashPassword } from "@/lib/auth/password";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireRole([UserRole.ADMIN]);
  if ("error" in auth) return auth.error;

  const data = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
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

export async function POST(req: Request) {
  const auth = await requireRole([UserRole.ADMIN]);
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.email || !body?.password || !body?.role) {
    return fail("Missing fields", 422);
  }

  if (![UserRole.ADMIN, UserRole.EDITOR].includes(body.role as UserRole)) {
    return fail("Invalid role", 422);
  }

  const exists = await prisma.user.findUnique({
    where: { email: String(body.email).toLowerCase() },
  });
  if (exists) {
    return fail("User already exists", 409);
  }

  const passwordHash = await hashPassword(String(body.password));

  const user = await prisma.user.create({
    data: {
      name: String(body.name),
      email: String(body.email).toLowerCase(),
      role: body.role as UserRole,
      passwordHash,
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

  return ok(user);
}
