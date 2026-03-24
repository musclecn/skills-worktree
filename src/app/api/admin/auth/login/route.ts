import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const result = schema.safeParse(body);

  if (!result.success) {
    return fail("Invalid login payload", 422);
  }

  const user = await prisma.user.findUnique({
    where: { email: result.data.email.toLowerCase() },
  });

  if (!user) {
    return fail("账号或密码错误", 401);
  }

  const passed = await verifyPassword(result.data.password, user.passwordHash);
  if (!passed) {
    return fail("账号或密码错误", 401);
  }

  const token = await createSessionToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  await setSessionCookie(token);

  return ok({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}
