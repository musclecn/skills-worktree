import { UserRole } from "@prisma/client";
import { fail } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    return { error: fail("Unauthorized", 401) };
  }
  return { user };
}

export async function requireRole(roles: UserRole[]) {
  const result = await requireAuth();
  if ("error" in result) {
    return result;
  }

  if (!roles.includes(result.user.role)) {
    return { error: fail("Forbidden", 403) };
  }

  return result;
}
