import { UserRole } from "@prisma/client";
import { fail } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/types";

// 明确的二选一类型：让调用方的 `"error" in auth` 能正确收窄，接口返回类型不再夹带 undefined
type AuthFailure = { error: ReturnType<typeof fail> };
type AuthSuccess = { user: SessionUser };
export type AuthResult = AuthFailure | AuthSuccess;

export async function requireAuth(): Promise<AuthResult> {
  const user = await getSessionUser();
  if (!user) {
    return { error: fail("Unauthorized", 401) };
  }
  return { user };
}

export async function requireRole(roles: UserRole[]): Promise<AuthResult> {
  const result = await requireAuth();
  if ("error" in result) {
    return result;
  }

  if (!roles.includes(result.user.role)) {
    return { error: fail("Forbidden", 403) };
  }

  return result;
}
